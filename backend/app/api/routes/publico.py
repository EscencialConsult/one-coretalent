"""Endpoints públicos (sin auth): marca de empresa por subdominio, registro público de
empresa (Talent Hub), listado de vacantes activas y postulación de candidatos.
"""
from __future__ import annotations

import base64
import datetime as dt
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_optional_current_persona
from app.core.db import apply_rls_context, apply_rls_pre_auth, get_db
from app.core.security import hash_password
from app.core.storage import subir_archivo, url_firmada
from app.models.enums import EstadoEmpresa, RolUsuario
from app.models.persona import Persona
from app.models.postulacion import Postulacion
from app.models.tenant import Empresa
from app.models.user import Usuario
from app.models.vacante import Vacante
from app.schemas.postulacion import PostulacionIn, PostulacionOut
from app.schemas.registro_publico import RegistroCandidatoIn, RegistroEmpresaIn
from app.schemas.vacante import VacantePublicaOut

router = APIRouter(prefix="/publico", tags=["público"])


@router.post("/registro-candidato", status_code=status.HTTP_201_CREATED)
async def registro_candidato(
    data: RegistroCandidatoIn, db: AsyncSession = Depends(get_db)
) -> dict:
    """Crea una identidad global de candidato sin exigir una postulación previa."""
    await apply_rls_pre_auth(db)
    email = data.email.strip().lower()
    existente = (
        await db.execute(select(Persona).where(func.lower(Persona.email) == email))
    ).scalar_one_or_none()
    if existente is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Ya existe una cuenta o un perfil asociado a ese email. Ingresá o recuperá tu acceso.",
        )

    db.add(
        Persona(
            nombre=data.nombre,
            apellido=data.apellido,
            email=email,
            password_hash=hash_password(data.password),
            activo=True,
        )
    )
    await db.commit()
    return {
        "ok": True,
        "mensaje": "Cuenta creada correctamente. Ya podés ingresar a tu portal.",
    }


@router.get("/marca/{subdominio}")
async def marca_por_subdominio(subdominio: str, db: AsyncSession = Depends(get_db)) -> dict:
    emp = (
        await db.execute(
            select(Empresa).where(func.lower(Empresa.subdominio) == subdominio.strip().lower())
        )
    ).scalar_one_or_none()
    if emp is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No hay una empresa con ese subdominio")
    return {
        "subdominio": emp.subdominio,
        "razon_social": emp.razon_social,
        "logo_url": emp.logo_url,
        "color_acento": emp.color_acento,
        "color_secundario": emp.color_secundario,
    }


@router.post("/registro-empresa", status_code=status.HTTP_201_CREATED)
async def registro_empresa(data: RegistroEmpresaIn, db: AsyncSession = Depends(get_db)) -> dict:
    """Auto-registro de empresa con verificación de identidad (flujo de Talent Hub).
    A diferencia del alta que hace el SuperAdmin (empresas.py, queda ACTIVO directo), acá
    la empresa queda PENDIENTE_VERIFICACION hasta que un admin la aprueba (ver admin.py)."""
    await apply_rls_pre_auth(db)  # busca por subdominio/email cruzando todos los tenants
    existe = await db.execute(select(Empresa).where(Empresa.subdominio == data.subdominio))
    if existe.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ya existe una empresa con ese subdominio")
    email = data.email_admin.lower()
    ya_usuario = await db.execute(select(Usuario).where(Usuario.email == email))
    if ya_usuario.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ya existe un usuario con ese email")

    selfie_url = await subir_archivo(
        "verificaciones-empresa", base64.b64decode(data.selfie_base64), "image/jpeg", "selfie.jpg"
    )
    firma_url = await subir_archivo(
        "verificaciones-empresa", base64.b64decode(data.firma_legal_base64), "image/png", "firma-legal.png"
    )
    dni_frente_url = (
        await subir_archivo("verificaciones-empresa", base64.b64decode(data.dni_frente_base64), "image/jpeg", "dni-frente.jpg")
        if data.dni_frente_base64 else None
    )
    dni_dorso_url = (
        await subir_archivo("verificaciones-empresa", base64.b64decode(data.dni_dorso_base64), "image/jpeg", "dni-dorso.jpg")
        if data.dni_dorso_base64 else None
    )

    empresa = Empresa(
        razon_social=data.razon_social,
        subdominio=data.subdominio,
        email_admin=data.email_admin,
        estado=EstadoEmpresa.PENDIENTE_VERIFICACION,
        cuit=data.cuit,
        rubro=data.rubro,
        dni=data.dni,
        selfie_url=selfie_url,
        firma_legal_url=firma_url,
        dni_frente_url=dni_frente_url,
        dni_dorso_url=dni_dorso_url,
        acepto_terminos=data.acepto_terminos,
        fecha_acepto_terminos=dt.datetime.now(dt.timezone.utc),
    )
    db.add(empresa)
    await db.flush()  # asigna empresa.id

    # A partir de acá ya sabemos el tenant real — se fija el contexto para que el INSERT
    # de Usuario (tenant-scoped) pase el WITH CHECK de RLS.
    await apply_rls_context(db, tenant_id=empresa.id)
    db.add(
        Usuario(
            email=email,
            password_hash=hash_password(data.admin_password),
            nombre=data.admin_nombre,
            apellido=data.admin_apellido,
            rol=RolUsuario.ADMIN_EMPRESA,
            tenant_id=empresa.id,
            activo=True,
        )
    )
    await db.commit()
    return {
        "ok": True,
        "estado": empresa.estado.value,
        "mensaje": "Registro recibido. Un administrador va a revisar tu cuenta antes de habilitarla.",
    }


@router.get("/vacantes", response_model=List[VacantePublicaOut])
async def vacantes_publicas(db: AsyncSession = Depends(get_db)) -> List[dict]:
    """Listado público de búsquedas activas, cruzando todas las empresas (reemplaza busquedas.html)."""
    await apply_rls_pre_auth(db)
    res = await db.execute(
        select(Vacante, Empresa.razon_social)
        .join(Empresa, Empresa.id == Vacante.tenant_id)
        .where(Vacante.estado == "activa", Empresa.estado == EstadoEmpresa.ACTIVO)
        .order_by(Vacante.created_at.desc())
    )
    return [
        {
            **{
                columna.name: getattr(vacante, columna.name)
                for columna in Vacante.__table__.columns
            },
            "empresa": razon_social,
        }
        for vacante, razon_social in res.all()
    ]


@router.post("/postular", response_model=PostulacionOut, status_code=status.HTTP_201_CREATED)
async def postular(
    data: PostulacionIn,
    persona_autenticada: Persona | None = Depends(get_optional_current_persona),
    db: AsyncSession = Depends(get_db),
) -> PostulacionOut:
    """Postulación pública a una vacante. Crea/actualiza la Persona (identidad global, por
    email) y crea la Postulacion. Si manda `password`, deja la cuenta lista para el login
    self-service (/auth/persona/login) — igual que "cuenta reutilizable" del legacy."""
    # La vacante activa es un recurso público incluso cuando la solicitud incluye
    # una sesión de Persona. Después se reemplaza este contexto por tenant+persona
    # antes de insertar la postulación.
    await apply_rls_pre_auth(db)
    vacante = await db.get(Vacante, data.vacante_id)
    if vacante is None or vacante.estado != "activa":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vacante no encontrada o no está activa")

    email = persona_autenticada.email if persona_autenticada is not None else data.email.lower()
    campos_persona = data.model_dump(
        exclude={
            "vacante_id", "email", "password", "cv_base64", "cv_nombre",
            "firma_consentimiento_base64", "firma_conformidad_base64",
            "respuesta_pregunta_1", "respuesta_pregunta_2",
        }
    )
    persona = persona_autenticada
    if persona is None:
        persona = (await db.execute(select(Persona).where(Persona.email == email))).scalar_one_or_none()
    if persona is None:
        persona = Persona(email=email, **campos_persona)
        if data.password and persona_autenticada is None:
            persona.password_hash = hash_password(data.password)
        db.add(persona)
        await db.flush()
    else:
        for campo, valor in campos_persona.items():
            setattr(persona, campo, valor)
        if data.password and persona_autenticada is None:
            persona.password_hash = hash_password(data.password)

    if data.cv_base64:
        persona.cv_url = await subir_archivo(
            "cvs", base64.b64decode(data.cv_base64), "application/pdf", data.cv_nombre or "cv.pdf"
        )
        persona.cv_nombre = data.cv_nombre

    # Ya existe la Persona: se fija el tenant real (el de la vacante) para que la
    # Postulacion (tenant-scoped) pase el WITH CHECK de RLS.
    await apply_rls_context(
        db,
        tenant_id=vacante.tenant_id,
        persona_id=persona.id if persona_autenticada is not None else None,
    )

    ya = await db.execute(
        select(Postulacion).where(Postulacion.persona_id == persona.id, Postulacion.vacante_id == vacante.id)
    )
    if ya.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ya te postulaste a esta búsqueda")

    respuestas = {}
    if data.respuesta_pregunta_1:
        respuestas["pregunta_1"] = data.respuesta_pregunta_1
    if data.respuesta_pregunta_2:
        respuestas["pregunta_2"] = data.respuesta_pregunta_2

    postulacion = Postulacion(
        tenant_id=vacante.tenant_id,
        persona_id=persona.id,
        vacante_id=vacante.id,
        respuestas_busqueda=respuestas or None,
    )
    if data.firma_consentimiento_base64:
        postulacion.firma_consentimiento_url = await subir_archivo(
            "firmas", base64.b64decode(data.firma_consentimiento_base64), "image/png", "consentimiento.png"
        )
        postulacion.fecha_firma_consentimiento = dt.datetime.now(dt.timezone.utc)
    if data.firma_conformidad_base64:
        postulacion.firma_conformidad_url = await subir_archivo(
            "firmas", base64.b64decode(data.firma_conformidad_base64), "image/png", "conformidad.png"
        )
        postulacion.fecha_firma_conformidad = dt.datetime.now(dt.timezone.utc)

    db.add(postulacion)
    await db.flush()
    await db.commit()

    cv_url = await url_firmada(persona.cv_url) if persona.cv_url else None
    return PostulacionOut(
        id=postulacion.id,
        persona_id=persona.id,
        vacante_id=vacante.id,
        nombre=persona.nombre,
        apellido=persona.apellido,
        email=persona.email,
        telefono=persona.telefono,
        perfil_profesional=persona.perfil_profesional,
        cv_url=cv_url,
        respuestas_busqueda=postulacion.respuestas_busqueda,
        created_at=postulacion.created_at,
    )
