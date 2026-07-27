"""Portal self-service de la Persona: perfil, postulaciones, CV y seguridad."""
from __future__ import annotations

import base64
import binascii
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_persona
from app.core.db import get_db
from app.core.security import hash_password, verify_password
from app.core.storage import subir_archivo, url_firmada
from app.models.asignacion import Asignacion
from app.models.persona import Persona
from app.models.postulacion import Postulacion
from app.models.tenant import Empresa
from app.models.vacante import Vacante
from app.schemas.persona_portal import (
    ConsentimientoOut,
    PersonaCvIn,
    PersonaPasswordIn,
    PersonaPerfilOut,
    PersonaPerfilUpdate,
    PostulacionPersonaDetalleOut,
    PostulacionPersonaResumenOut,
)

router = APIRouter(prefix="/personas/me", tags=["portal candidato"])


async def _perfil_out(persona: Persona) -> PersonaPerfilOut:
    return PersonaPerfilOut(
        id=persona.id,
        email=persona.email,
        nombre=persona.nombre,
        apellido=persona.apellido,
        telefono=persona.telefono,
        puesto_deseado=persona.puesto_deseado,
        fecha_nacimiento=persona.fecha_nacimiento,
        identificacion=persona.identificacion,
        provincia=persona.provincia,
        codigo_postal_ciudad=persona.codigo_postal_ciudad,
        perfil_profesional=persona.perfil_profesional,
        descripcion_perfil=persona.descripcion_perfil,
        formacion=persona.formacion or [],
        idiomas=persona.idiomas or [],
        experiencias=persona.experiencias or [],
        disp_viajar=persona.disp_viajar,
        disp_cambio_residencia=persona.disp_cambio_residencia,
        primer_empleo=persona.primer_empleo,
        cv_nombre=persona.cv_nombre,
        cv_url=await url_firmada(persona.cv_url) if persona.cv_url else None,
    )


@router.get("/perfil", response_model=PersonaPerfilOut)
async def obtener_mi_perfil(persona: Persona = Depends(get_current_persona)) -> PersonaPerfilOut:
    return await _perfil_out(persona)


@router.put("/perfil", response_model=PersonaPerfilOut)
async def actualizar_mi_perfil(
    data: PersonaPerfilUpdate,
    persona: Persona = Depends(get_current_persona),
    db: AsyncSession = Depends(get_db),
) -> PersonaPerfilOut:
    for campo, valor in data.model_dump().items():
        setattr(persona, campo, valor)
    await db.commit()
    return await _perfil_out(persona)


@router.post("/cv", response_model=PersonaPerfilOut)
async def actualizar_mi_cv(
    data: PersonaCvIn,
    persona: Persona = Depends(get_current_persona),
    db: AsyncSession = Depends(get_db),
) -> PersonaPerfilOut:
    try:
        contenido = base64.b64decode(data.base64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "El CV no contiene base64 válido") from exc
    if len(contenido) > 5 * 1024 * 1024 or not contenido.startswith(b"%PDF-"):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "El CV debe ser un PDF válido de hasta 5 MB")
    persona.cv_url = await subir_archivo("cvs", contenido, "application/pdf", data.nombre)
    persona.cv_nombre = data.nombre
    await db.commit()
    return await _perfil_out(persona)


@router.post("/password")
async def cambiar_mi_password(
    data: PersonaPasswordIn,
    persona: Persona = Depends(get_current_persona),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if not persona.password_hash or not verify_password(data.password_actual, persona.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La contraseña actual no es correcta")
    if data.password_actual == data.password_nueva:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La contraseña nueva debe ser diferente")
    persona.password_hash = hash_password(data.password_nueva)
    await db.commit()
    return {"ok": True}


async def _conteos(postulacion_id: uuid.UUID, db: AsyncSession) -> tuple[int, int, int]:
    filas = (
        await db.execute(
            select(Asignacion.estado, func.count())
            .where(Asignacion.postulacion_id == postulacion_id)
            .group_by(Asignacion.estado)
        )
    ).all()
    por_estado = dict(filas)
    total = sum(por_estado.values())
    completadas = por_estado.get("completado", 0)
    return total, total - completadas, completadas


async def _conteos_batch(
    postulacion_ids: list[uuid.UUID], db: AsyncSession
) -> dict[uuid.UUID, tuple[int, int, int]]:
    """Versión en lote de `_conteos`: una sola query agrupada en vez de una por postulación."""
    if not postulacion_ids:
        return {}
    filas = (
        await db.execute(
            select(Asignacion.postulacion_id, Asignacion.estado, func.count())
            .where(Asignacion.postulacion_id.in_(postulacion_ids))
            .group_by(Asignacion.postulacion_id, Asignacion.estado)
        )
    ).all()
    por_postulacion: dict[uuid.UUID, dict[str, int]] = {}
    for postulacion_id, estado, cantidad in filas:
        por_postulacion.setdefault(postulacion_id, {})[estado] = cantidad
    resultado = {}
    for pid in postulacion_ids:
        por_estado = por_postulacion.get(pid, {})
        total = sum(por_estado.values())
        completadas = por_estado.get("completado", 0)
        resultado[pid] = (total, total - completadas, completadas)
    return resultado


@router.get("/postulaciones", response_model=list[PostulacionPersonaResumenOut])
async def mis_postulaciones(
    persona: Persona = Depends(get_current_persona),
    db: AsyncSession = Depends(get_db),
) -> list[PostulacionPersonaResumenOut]:
    filas = (
        await db.execute(
            select(Postulacion, Vacante, Empresa)
            .join(Vacante, Vacante.id == Postulacion.vacante_id)
            .join(Empresa, Empresa.id == Postulacion.tenant_id)
            .where(Postulacion.persona_id == persona.id)
            .order_by(Postulacion.created_at.desc())
        )
    ).all()
    conteos = await _conteos_batch([postulacion.id for postulacion, _, _ in filas], db)
    salida = []
    for postulacion, vacante, empresa in filas:
        total, pendientes, completadas = conteos[postulacion.id]
        salida.append(PostulacionPersonaResumenOut(
            id=postulacion.id,
            vacante_id=vacante.id,
            puesto=vacante.puesto,
            empresa=empresa.razon_social,
            estado_vacante=vacante.estado,
            created_at=postulacion.created_at,
            evaluaciones_total=total,
            evaluaciones_pendientes=pendientes,
            evaluaciones_completadas=completadas,
        ))
    return salida


@router.get("/postulaciones/{postulacion_id}", response_model=PostulacionPersonaDetalleOut)
async def mi_postulacion(
    postulacion_id: uuid.UUID,
    persona: Persona = Depends(get_current_persona),
    db: AsyncSession = Depends(get_db),
) -> PostulacionPersonaDetalleOut:
    fila = (
        await db.execute(
            select(Postulacion, Vacante, Empresa)
            .join(Vacante, Vacante.id == Postulacion.vacante_id)
            .join(Empresa, Empresa.id == Postulacion.tenant_id)
            .where(Postulacion.id == postulacion_id, Postulacion.persona_id == persona.id)
        )
    ).one_or_none()
    if fila is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Postulación no encontrada")
    postulacion, vacante, empresa = fila
    total, pendientes, completadas = await _conteos(postulacion.id, db)
    return PostulacionPersonaDetalleOut(
        id=postulacion.id,
        vacante_id=vacante.id,
        puesto=vacante.puesto,
        empresa=empresa.razon_social,
        estado_vacante=vacante.estado,
        created_at=postulacion.created_at,
        evaluaciones_total=total,
        evaluaciones_pendientes=pendientes,
        evaluaciones_completadas=completadas,
        descripcion=vacante.descripcion,
        modalidad=vacante.modalidad,
        provincia=vacante.provincia,
        localidad=vacante.localidad,
        respuestas_busqueda=postulacion.respuestas_busqueda,
        consentimiento_firmado_at=postulacion.fecha_firma_consentimiento,
        conformidad_firmada_at=postulacion.fecha_firma_conformidad,
    )


@router.get("/consentimientos", response_model=list[ConsentimientoOut])
async def mis_consentimientos(
    persona: Persona = Depends(get_current_persona),
    db: AsyncSession = Depends(get_db),
) -> list[ConsentimientoOut]:
    filas = (
        await db.execute(
            select(Postulacion, Vacante, Empresa)
            .join(Vacante, Vacante.id == Postulacion.vacante_id)
            .join(Empresa, Empresa.id == Postulacion.tenant_id)
            .where(Postulacion.persona_id == persona.id)
            .order_by(Postulacion.created_at.desc())
        )
    ).all()
    conteos = await _conteos_batch([postulacion.id for postulacion, _, _ in filas], db)
    salida = []
    for postulacion, vacante, empresa in filas:
        total, _, _ = conteos[postulacion.id]
        salida.append(ConsentimientoOut(
            postulacion_id=postulacion.id,
            vacante=vacante.puesto,
            empresa=empresa.razon_social,
            consentimiento_firmado_at=postulacion.fecha_firma_consentimiento,
            conformidad_firmada_at=postulacion.fecha_firma_conformidad,
            evaluaciones=total,
        ))
    return salida
