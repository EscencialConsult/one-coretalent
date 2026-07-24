"""Áreas/Departamentos de la empresa (aislados por empresa) + sus miembros."""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant_id
from app.core.db import get_db
from app.models.area import Area
from app.models.evaluado import Evaluado

router = APIRouter(prefix="/empresa/areas", tags=["áreas (empresa)"])


class AreaCreate(BaseModel):
    nombre: str


@router.get("")
async def listar_areas(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    areas = list(
        (await db.execute(select(Area).where(Area.tenant_id == tenant_id).order_by(Area.nombre))).scalars().all()
    )
    return [{"id": str(a.id), "nombre": a.nombre} for a in areas]


@router.post("", status_code=status.HTTP_201_CREATED)
async def crear_area(
    data: AreaCreate,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    nombre = data.nombre.strip()
    if not nombre:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "El nombre no puede estar vacío")
    dup = await db.execute(select(Area).where(Area.tenant_id == tenant_id, Area.nombre == nombre))
    if dup.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ya existe un área con ese nombre")
    area = Area(tenant_id=tenant_id, nombre=nombre)
    db.add(area)
    await db.flush()  # popula id vía RETURNING, dentro de la transacción con contexto RLS
    await db.commit()
    return {"id": str(area.id), "nombre": area.nombre}


@router.delete("/{area_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_area(
    area_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    area = await db.get(Area, area_id)
    if area is None or area.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Área no encontrada")
    await db.delete(area)
    await db.commit()


@router.get("/{area_id}/miembros")
async def miembros_area(
    area_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    area = await db.get(Area, area_id)
    if area is None or area.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Área no encontrada")
    # Solo colaboradores: los postulantes no participan de 360°/áreas/procesos.
    evs = list(
        (
            await db.execute(
                select(Evaluado)
                .where(
                    Evaluado.tenant_id == tenant_id,
                    Evaluado.area_id == area_id,
                    Evaluado.tipo == "colaborador",
                )
                .order_by(Evaluado.apellido, Evaluado.nombre)
            )
        ).scalars().all()
    )
    return [{"id": str(e.id), "nombre": f"{e.nombre} {e.apellido}".strip(), "email": e.email} for e in evs]
