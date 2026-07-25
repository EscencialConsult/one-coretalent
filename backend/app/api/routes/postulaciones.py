"""Postulaciones vistas por el Admin de Empresa (aisladas por empresa vía la vacante)."""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant_id
from app.core.db import get_db
from app.core.storage import url_firmada
from app.models.persona import Persona
from app.models.postulacion import Postulacion
from app.models.vacante import Vacante
from app.schemas.postulacion import PostulacionOut, PostulacionResumenOut

router = APIRouter(tags=["postulaciones (empresa)"])


async def _get_vacante_propia(vacante_id: uuid.UUID, tenant_id: uuid.UUID, db: AsyncSession) -> Vacante:
    v = await db.get(Vacante, vacante_id)
    if v is None or v.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vacante no encontrada")
    return v


@router.get("/vacantes/{vacante_id}/postulaciones", response_model=List[PostulacionOut])
async def listar_postulaciones(
    vacante_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> List[PostulacionOut]:
    await _get_vacante_propia(vacante_id, tenant_id, db)
    filas = (
        await db.execute(
            select(Postulacion, Persona)
            .join(Persona, Persona.id == Postulacion.persona_id)
            .where(Postulacion.vacante_id == vacante_id)
            .order_by(Postulacion.created_at.desc())
        )
    ).all()

    salida: List[PostulacionOut] = []
    for post, persona in filas:
        cv_url = await url_firmada(persona.cv_url) if persona.cv_url else None
        salida.append(
            PostulacionOut(
                id=post.id,
                persona_id=persona.id,
                vacante_id=post.vacante_id,
                nombre=persona.nombre,
                apellido=persona.apellido,
                email=persona.email,
                telefono=persona.telefono,
                perfil_profesional=persona.perfil_profesional,
                cv_url=cv_url,
                respuestas_busqueda=post.respuestas_busqueda,
                created_at=post.created_at,
            )
        )
    return salida


@router.get("/postulaciones", response_model=List[PostulacionResumenOut])
async def listar_todas_postulaciones(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> List[PostulacionResumenOut]:
    filas = (
        await db.execute(
            select(Postulacion, Persona, Vacante)
            .join(Persona, Persona.id == Postulacion.persona_id)
            .join(Vacante, Vacante.id == Postulacion.vacante_id)
            .where(Postulacion.tenant_id == tenant_id, Vacante.tenant_id == tenant_id)
            .order_by(Postulacion.created_at.desc())
        )
    ).all()

    salida: List[PostulacionResumenOut] = []
    for post, persona, vacante in filas:
        cv_url = await url_firmada(persona.cv_url) if persona.cv_url else None
        salida.append(
            PostulacionResumenOut(
                id=post.id,
                persona_id=persona.id,
                vacante_id=post.vacante_id,
                nombre=persona.nombre,
                apellido=persona.apellido,
                email=persona.email,
                telefono=persona.telefono,
                perfil_profesional=persona.perfil_profesional,
                cv_url=cv_url,
                vacante_puesto=vacante.puesto,
                created_at=post.created_at,
            )
        )
    return salida
