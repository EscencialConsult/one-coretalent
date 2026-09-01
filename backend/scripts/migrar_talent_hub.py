"""Migra datos del Talent Hub legacy (Google Sheets) a la base nueva.

Lee 4 CSV exportados directo de la hoja "Base Postulantes" (pestañas Usuarios,
Busquedas, Perfiles, Postulantes) y crea: Empresa + Usuario (admin) por cada
empresa vieja, Vacante por cada búsqueda, Persona por cada perfil de candidato,
y Postulacion por cada postulación real.

Los archivos (CVs, firmas) NO se migran en esta etapa — quedan las fechas de
firma pero sin URL, hasta la migración de archivos (fase 2).

Uso:
    python -m scripts.migrar_talent_hub --dir <carpeta con los 4 csv>              (dry-run, no escribe nada)
    python -m scripts.migrar_talent_hub --dir <carpeta con los 4 csv> --commit     (escribe de verdad)
"""
from __future__ import annotations

import argparse
import asyncio
import csv
import datetime as dt
import json
import re
import sys
import unicodedata
import uuid
from pathlib import Path

from sqlalchemy import select

from app.core.db import SessionLocal, apply_rls_context
from app.core.security import hash_password
from app.models.enums import EstadoEmpresa, RolUsuario
from app.models.persona import Persona
from app.models.postulacion import Postulacion
from app.models.tenant import Empresa
from app.models.user import Usuario
from app.models.vacante import Vacante

sys.stdout.reconfigure(encoding="utf-8")

# Caracteres invisibles (zero-width) que aparecen pegados a algunos emails de la
# planilla vieja por copy-paste — los sacamos antes de usar el email para nada.
_INVISIBLES = re.compile(r"[​‌‍﻿]")


def limpiar_email(valor: str | None) -> str:
    return _INVISIBLES.sub("", (valor or "")).strip().lower()


def leer_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


# El Sheet viejo (columna "Estado" de la hoja Usuarios, ver Codigo.gs:81/2226) solo usa
# 'aprobado' | 'rechazado' | 'pendiente'. Antes esto se ignoraba por completo y toda empresa
# migrada quedaba ACTIVO sin importar si de verdad había pasado la revisión manual de RRHH —
# auditoría 2026-09-01: 18 de 21 empresas activas en producción sin selfie/firma/DNI cargados.
_ESTADO_SHEET_A_ENUM = {
    "aprobado": EstadoEmpresa.ACTIVO,
    "rechazado": EstadoEmpresa.RECHAZADA,
    "pendiente": EstadoEmpresa.PENDIENTE_VERIFICACION,
}


def mapear_estado_empresa(valor: str | None) -> EstadoEmpresa:
    """Default seguro: si el Sheet no trae un Estado reconocido (fila vieja, columna vacía),
    la empresa queda PENDIENTE_VERIFICACION en vez de ACTIVO — que la revise un humano antes
    de operar, en vez de asumir que ya pasó control."""
    return _ESTADO_SHEET_A_ENUM.get((valor or "").strip().lower(), EstadoEmpresa.PENDIENTE_VERIFICACION)


def slugify(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    texto = re.sub(r"[^a-zA-Z0-9]+", "-", texto).strip("-").lower()
    return texto[:63] or "empresa"


def parse_fecha(valor: str | None) -> dt.datetime | None:
    if not valor or not valor.strip():
        return None
    valor = valor.strip()
    formatos = ["%m/%d/%Y %H:%M:%S", "%m/%d/%Y", "%Y-%m-%d"]
    for fmt in formatos:
        try:
            return dt.datetime.strptime(valor, fmt).replace(tzinfo=dt.timezone.utc)
        except ValueError:
            continue
    return None


def parse_json_lista(valor: str | None) -> list | None:
    if not valor or not valor.strip():
        return None
    try:
        data = json.loads(valor)
        return data if data else None
    except (json.JSONDecodeError, TypeError):
        return None


def parse_bool_disponibilidad(valor: str | None) -> bool:
    return (valor or "").strip().lower() == "sí" or (valor or "").strip().lower() == "si"


def parse_respuestas_busqueda(valor: str | None) -> dict | None:
    items = parse_json_lista(valor)
    if not items:
        return None
    salida = {}
    for i, item in enumerate(items[:2], start=1):
        if isinstance(item, dict) and item.get("respuesta"):
            salida[f"pregunta_{i}"] = item["respuesta"]
    return salida or None


async def migrar(directorio: Path, commit: bool) -> None:
    usuarios_csv = leer_csv(directorio / "Usuarios.csv")
    busquedas_csv = leer_csv(directorio / "Busquedas.csv")
    perfiles_csv = leer_csv(directorio / "Perfiles.csv")
    postulantes_csv = leer_csv(directorio / "Postulantes.csv")

    resumen = {
        "empresas_creadas": [], "empresas_saltadas": [],
        "vacantes_creadas": [], "vacantes_saltadas": [],
        "personas_creadas": [], "personas_saltadas": [],
        "postulaciones_creadas": [], "postulaciones_saltadas": [],
    }

    async with SessionLocal() as db:
        await apply_rls_context(db, tenant_id=None, is_superadmin=True)

        # ── 1) Empresas + Usuario admin ──────────────────────────────────────
        email_a_tenant: dict[str, uuid.UUID] = {}
        subdominios_usados: set[str] = set()
        for fila in usuarios_csv:
            if (fila.get("Rol") or "").strip() != "empresa":
                continue
            email = limpiar_email(fila.get("Email"))
            if not email:
                continue
            existente = (
                await db.execute(select(Usuario).where(Usuario.email == email))
            ).scalar_one_or_none()
            if existente is not None:
                resumen["empresas_saltadas"].append(f"{email} (ya existe un Usuario con ese email)")
                email_a_tenant[email] = existente.tenant_id
                continue

            razon_social = (fila.get("Empresa") or fila.get("Nombre") or email).strip()
            base_slug = slugify(razon_social)
            slug = base_slug
            n = 2
            while slug in subdominios_usados or (
                await db.execute(select(Empresa).where(Empresa.subdominio == slug))
            ).scalar_one_or_none() is not None:
                slug = f"{base_slug}-{n}"
                n += 1
            subdominios_usados.add(slug)

            empresa_id = uuid.uuid4()
            usuario_id = uuid.uuid4()
            estado_mapeado = mapear_estado_empresa(fila.get("Estado"))
            resumen["empresas_creadas"].append(
                f"{razon_social} (subdominio={slug}, admin={email}, cuit={fila.get('Cuit') or '-'}, "
                f"estado={estado_mapeado.value})"
            )
            if commit:
                empresa = Empresa(
                    id=empresa_id,
                    razon_social=razon_social,
                    subdominio=slug,
                    email_admin=email,
                    estado=mapear_estado_empresa(fila.get("Estado")),
                    cuit=(fila.get("Cuit") or "").strip() or None,
                    rubro=(fila.get("Rubro") or "").strip() or None,
                    dni=(fila.get("Dni") or "").strip() or None,
                    acepto_terminos=True,
                    fecha_acepto_terminos=parse_fecha(fila.get("FechaAceptoTerminos") or fila.get("FechaRegistro")),
                )
                db.add(empresa)
                await db.flush()
                await apply_rls_context(db, tenant_id=empresa.id)
                usuario = Usuario(
                    id=usuario_id,
                    email=email,
                    password_hash=hash_password(fila.get("Password") or uuid.uuid4().hex),
                    nombre=(fila.get("Nombre") or "Admin").strip() or "Admin",
                    apellido=(fila.get("Apellido") or "").strip() or "-",
                    rol=RolUsuario.ADMIN_EMPRESA,
                    tenant_id=empresa.id,
                    activo=True,
                )
                db.add(usuario)
                await db.flush()
                await apply_rls_context(db, tenant_id=None, is_superadmin=True)
            email_a_tenant[email] = empresa_id

        # ── 2) Vacantes ───────────────────────────────────────────────────────
        vacante_id_a_tenant: dict[str, uuid.UUID] = {}
        for fila in busquedas_csv:
            legacy_id = (fila.get("ID") or "").strip()
            if not legacy_id:
                continue
            email_empresa = limpiar_email(fila.get("UsuarioEmpresa"))
            tenant_id = email_a_tenant.get(email_empresa)
            if tenant_id is None:
                resumen["vacantes_saltadas"].append(
                    f"{fila.get('Puesto')} (empresa '{email_empresa}' no encontrada/migrada)"
                )
                continue
            try:
                vac_uuid = uuid.UUID(legacy_id)
            except ValueError:
                resumen["vacantes_saltadas"].append(f"{fila.get('Puesto')} (ID legacy inválido: {legacy_id})")
                continue

            ya_existe = await db.get(Vacante, vac_uuid) if commit else None
            if ya_existe is not None:
                resumen["vacantes_saltadas"].append(f"{fila.get('Puesto')} (ya existe)")
                vacante_id_a_tenant[legacy_id] = ya_existe.tenant_id
                continue

            resumen["vacantes_creadas"].append(f"{fila.get('Puesto')} ({fila.get('Empresa')})")
            if commit:
                estado_legacy = (fila.get("Estado") or "activa").strip().lower()
                estado = estado_legacy if estado_legacy in {"borrador", "activa", "pausada", "cerrada"} else "activa"
                vacante = Vacante(
                    id=vac_uuid,
                    tenant_id=tenant_id,
                    puesto=(fila.get("Puesto") or "Sin título").strip(),
                    descripcion=(fila.get("Descripcion") or "").strip() or None,
                    provincia=(fila.get("Provincia") or "").strip() or None,
                    localidad=(fila.get("Localidad") or "").strip() or None,
                    modalidad=(fila.get("Modalidad") or "").strip() or None,
                    jornada=(fila.get("Jornada") or "").strip() or None,
                    vacantes=int(fila.get("Vacantes") or 1) if (fila.get("Vacantes") or "").strip().isdigit() else 1,
                    estado=estado,
                    area=(fila.get("Area") or "").strip() or None,
                    tipo_contrato=(fila.get("TipoContrato") or "").strip() or None,
                    zona=(fila.get("Zona") or "").strip() or None,
                    responsabilidades=(fila.get("Responsabilidades") or "").strip() or None,
                    requisitos_excluyentes=(fila.get("RequisitosExcluyentes") or "").strip() or None,
                    requisitos_deseables=(fila.get("RequisitosDeseables") or "").strip() or None,
                    habilidades=(fila.get("Habilidades") or "").strip() or None,
                    idioma_requerido=(fila.get("IdiomaRequerido") or "").strip() or None,
                    nivel_idioma=(fila.get("NivelIdioma") or "").strip() or None,
                    salario_min=float(fila["SalarioMin"]) if (fila.get("SalarioMin") or "").strip() else None,
                    salario_max=float(fila["SalarioMax"]) if (fila.get("SalarioMax") or "").strip() else None,
                    ocultar_salario=(fila.get("OcultarSalario") or "").strip().lower() in {"sí", "si"},
                    horario=(fila.get("Horario") or "").strip() or None,
                    beneficios=(fila.get("Beneficios") or "").strip() or None,
                    beneficios_otros=(fila.get("BeneficiosOtros") or "").strip() or None,
                    fecha_vencimiento=parse_fecha(fila.get("FechaVencimiento")),
                    reclutador=(fila.get("Reclutador") or "").strip() or None,
                    pregunta_1=(fila.get("Pregunta1") or "").strip() or None,
                    pregunta_2=(fila.get("Pregunta2") or "").strip() or None,
                    tests_requeridos=[],
                )
                db.add(vacante)
                await db.flush()
            vacante_id_a_tenant[legacy_id] = tenant_id

        # ── 3) Personas ──────────────────────────────────────────────────────
        email_a_persona: dict[str, uuid.UUID] = {}
        for fila in perfiles_csv:
            email = limpiar_email(fila.get("Email"))
            if not email or "@" not in email:
                resumen["personas_saltadas"].append(f"(fila sin email válido: {fila.get('Nombre')})")
                continue
            if (fila.get("Apellido") or "").strip().lower() == "prueba":
                resumen["personas_saltadas"].append(f"{email} (perfil de prueba interno, apellido 'Prueba')")
                continue
            existente = (
                await db.execute(select(Persona).where(Persona.email == email))
            ).scalar_one_or_none()
            if existente is not None:
                resumen["personas_saltadas"].append(f"{email} (ya existe)")
                email_a_persona[email] = existente.id
                continue

            persona_id = uuid.uuid4()
            resumen["personas_creadas"].append(f"{fila.get('Nombre')} {fila.get('Apellido')} <{email}>")
            if commit:
                persona = Persona(
                    id=persona_id,
                    email=email,
                    password_hash=hash_password(fila["Password"]) if (fila.get("Password") or "").strip() else None,
                    nombre=(fila.get("Nombre") or "-").strip() or "-",
                    apellido=(fila.get("Apellido") or "-").strip() or "-",
                    telefono=(fila.get("Telefono") or "").strip() or None,
                    puesto_deseado=(fila.get("PuestoDeseado") or "").strip() or None,
                    fecha_nacimiento=(fila.get("FechaNacimiento") or "").strip() or None,
                    identificacion=(fila.get("Identificacion") or "").strip() or None,
                    provincia=(fila.get("Provincia") or "").strip() or None,
                    codigo_postal_ciudad=(fila.get("CodigoPostalCiudad") or "").strip() or None,
                    perfil_profesional=(fila.get("PerfilProfesional") or "")[:160] or None,
                    formacion=parse_json_lista(fila.get("Formacion")),
                    descripcion_perfil=(fila.get("DescripcionPerfil") or "").strip() or None,
                    disp_viajar=parse_bool_disponibilidad(fila.get("DispViajar")),
                    disp_cambio_residencia=parse_bool_disponibilidad(fila.get("DispCambioResidencia")),
                    idiomas=parse_json_lista(fila.get("Idiomas")),
                    primer_empleo=parse_bool_disponibilidad(fila.get("PrimerEmpleo")),
                    experiencias=parse_json_lista(fila.get("Experiencias")),
                    cv_nombre=(fila.get("CVNombre") or "").strip() or None,
                    # CVUrl / FirmaXUrl: NO se migran en esta etapa (son links de Drive,
                    # no de Supabase Storage) - fase 2.
                    activo=True,
                )
                db.add(persona)
                await db.flush()
            email_a_persona[email] = persona_id

        # ── 4) Postulaciones ─────────────────────────────────────────────────
        for fila in postulantes_csv:
            email = limpiar_email(fila.get("Email"))
            legacy_busqueda_id = (fila.get("BusquedaID") or "").strip()
            persona_id = email_a_persona.get(email)
            tenant_id = vacante_id_a_tenant.get(legacy_busqueda_id)
            try:
                vac_uuid = uuid.UUID(legacy_busqueda_id) if legacy_busqueda_id else None
            except ValueError:
                vac_uuid = None

            if persona_id is None or vac_uuid is None or tenant_id is None:
                resumen["postulaciones_saltadas"].append(
                    f"{email} -> {fila.get('BusquedaPuesto')} "
                    f"(persona={'ok' if persona_id else 'FALTA'}, vacante={'ok' if vac_uuid else 'FALTA'})"
                )
                continue

            if commit:
                ya = (
                    await db.execute(
                        select(Postulacion).where(
                            Postulacion.persona_id == persona_id, Postulacion.vacante_id == vac_uuid
                        )
                    )
                ).scalar_one_or_none()
                if ya is not None:
                    resumen["postulaciones_saltadas"].append(f"{email} -> {fila.get('BusquedaPuesto')} (ya existe)")
                    continue

            resumen["postulaciones_creadas"].append(f"{email} -> {fila.get('BusquedaPuesto')}")
            if commit:
                await apply_rls_context(db, tenant_id=tenant_id, persona_id=persona_id)
                postulacion = Postulacion(
                    tenant_id=tenant_id,
                    persona_id=persona_id,
                    vacante_id=vac_uuid,
                    respuestas_busqueda=parse_respuestas_busqueda(fila.get("RespuestasBusqueda")),
                    fecha_firma_consentimiento=parse_fecha(fila.get("FechaFirmaConsentimiento")),
                    fecha_firma_conformidad=parse_fecha(fila.get("FechaFirmaConformidad")),
                )
                db.add(postulacion)
                await db.flush()
                await apply_rls_context(db, tenant_id=None, is_superadmin=True)

        if commit:
            await db.commit()
            print("=== COMMIT REALIZADO ===\n")
        else:
            await db.rollback()
            print("=== DRY-RUN (no se escribió nada) ===\n")

    for clave, items in resumen.items():
        print(f"--- {clave} ({len(items)}) ---")
        for item in items:
            print(f"  {item}")
        print()


def main() -> None:
    parser = argparse.ArgumentParser(description="Migra datos del Talent Hub legacy")
    parser.add_argument("--dir", required=True, type=Path, help="Carpeta con Usuarios.csv, Busquedas.csv, Perfiles.csv, Postulantes.csv")
    parser.add_argument("--commit", action="store_true", help="Escribe de verdad (por defecto es dry-run)")
    args = parser.parse_args()
    asyncio.run(migrar(args.dir, args.commit))


if __name__ == "__main__":
    main()
