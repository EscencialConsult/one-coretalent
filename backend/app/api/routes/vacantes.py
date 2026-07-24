"""Vacantes del Admin de Empresa (aisladas por empresa) — reemplaza la hoja "Busquedas"."""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant_id
from app.core.db import get_db
from app.core.matching import notificar_postulantes_compatibles
from app.models.vacante import Vacante
from app.schemas.vacante import VacanteCreate, VacanteEstadoIn, VacanteOut, VacanteUpdate

router = APIRouter(prefix="/vacantes", tags=["vacantes (empresa)"])

_ESTADOS_VALIDOS = {"borrador", "activa", "pausada", "cerrada"}


async def _get_vacante(vacante_id: uuid.UUID, tenant_id: uuid.UUID, db: AsyncSession) -> Vacante:
    v = await db.get(Vacante, vacante_id)
    if v is None or v.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vacante no encontrada")
    return v


@router.get("", response_model=List[VacanteOut])
async def listar_vacantes(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> List[Vacante]:
    res = await db.execute(
        select(Vacante).where(Vacante.tenant_id == tenant_id).order_by(Vacante.created_at.desc())
    )
    return list(res.scalars().all())


@router.post("", response_model=VacanteOut, status_code=status.HTTP_201_CREATED)
async def crear_vacante(
    data: VacanteCreate,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> Vacante:
    vacante = Vacante(tenant_id=tenant_id, estado="borrador", **data.model_dump())
    db.add(vacante)
    await db.flush()  # puebla id/created_at vía RETURNING, todavía dentro de la transacción con contexto RLS
    await db.commit()
    return vacante


@router.get("/{vacante_id}", response_model=VacanteOut)
async def obtener_vacante(
    vacante_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> Vacante:
    return await _get_vacante(vacante_id, tenant_id, db)


@router.put("/{vacante_id}", response_model=VacanteOut)
async def actualizar_vacante(
    vacante_id: uuid.UUID,
    data: VacanteUpdate,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> Vacante:
    vacante = await _get_vacante(vacante_id, tenant_id, db)
    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(vacante, campo, valor)
    await db.flush()
    await db.commit()
    return vacante


@router.patch("/{vacante_id}/estado", response_model=VacanteOut)
async def cambiar_estado_vacante(
    vacante_id: uuid.UUID,
    data: VacanteEstadoIn,
    background: BackgroundTasks,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> Vacante:
    if data.estado not in _ESTADOS_VALIDOS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Estado inválido. Válidos: {', '.join(sorted(_ESTADOS_VALIDOS))}")
    vacante = await _get_vacante(vacante_id, tenant_id, db)
    estado_anterior = vacante.estado
    vacante.estado = data.estado
    await db.flush()
    await db.commit()

    # Igual que el legacy (Codigo.gs notificarPostulantesCompatibles): el motor de matching
    # corre cuando la vacante QUEDA activa, no en cada edición. En background: no debe demorar
    # la respuesta al admin, y corre con su propia sesión elevada (ver core/matching.py).
    if vacante.estado == "activa" and estado_anterior != "activa":
        background.add_task(notificar_postulantes_compatibles, vacante.id)

    return vacante


@router.delete("/{vacante_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_vacante(
    vacante_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    vacante = await _get_vacante(vacante_id, tenant_id, db)
    await db.delete(vacante)
    await db.commit()
