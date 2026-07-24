"""Endpoints del Admin de Empresa: gestión de Perfiles (aislados por empresa)."""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant_id
from app.core.db import get_db
from app.models.perfil import Perfil
from app.schemas.perfil import PerfilCreate, PerfilOut

router = APIRouter(prefix="/perfiles", tags=["perfiles (empresa)"])


@router.get("", response_model=List[PerfilOut])
async def listar_perfiles(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> List[Perfil]:
    result = await db.execute(
        select(Perfil).where(Perfil.tenant_id == tenant_id).order_by(Perfil.nombre)
    )
    return list(result.scalars().all())


@router.post("", response_model=PerfilOut, status_code=status.HTTP_201_CREATED)
async def crear_perfil(
    data: PerfilCreate,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> Perfil:
    dup = await db.execute(
        select(Perfil).where(Perfil.tenant_id == tenant_id, Perfil.nombre == data.nombre)
    )
    if dup.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ya existe un perfil con ese nombre")
    perfil = Perfil(tenant_id=tenant_id, nombre=data.nombre)
    db.add(perfil)
    await db.flush()  # popula id/created_at vía RETURNING, dentro de la transacción con contexto RLS
    await db.commit()
    return perfil


@router.delete("/{perfil_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_perfil(
    perfil_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    perfil = await db.get(Perfil, perfil_id)
    if perfil is None or perfil.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Perfil no encontrado")
    await db.delete(perfil)
    await db.commit()
