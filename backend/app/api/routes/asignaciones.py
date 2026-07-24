"""Asignación de tests a evaluados (Admin de Empresa, aislado por empresa)."""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant_id
from app.core import engine
from app.core.db import get_db
from app.models.asignacion import Asignacion
from app.models.empresa_test import EmpresaTest
from app.models.evaluado import Evaluado
from app.schemas.asignacion import AsignacionCreate, AsignacionOut

router = APIRouter(tags=["asignaciones (empresa)"])


async def _evaluado_de_empresa(
    evaluado_id: uuid.UUID, tenant_id: uuid.UUID, db: AsyncSession
) -> Evaluado:
    ev = await db.get(Evaluado, evaluado_id)
    if ev is None or ev.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Evaluado no encontrado")
    return ev


@router.get("/evaluados/{evaluado_id}/asignaciones", response_model=List[AsignacionOut])
async def listar_asignaciones(
    evaluado_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> List[Asignacion]:
    await _evaluado_de_empresa(evaluado_id, tenant_id, db)
    res = await db.execute(
        select(Asignacion).where(Asignacion.evaluado_id == evaluado_id).order_by(Asignacion.created_at)
    )
    return list(res.scalars().all())


@router.post(
    "/evaluados/{evaluado_id}/asignaciones",
    response_model=AsignacionOut,
    status_code=status.HTTP_201_CREATED,
)
async def asignar_test(
    evaluado_id: uuid.UUID,
    data: AsignacionCreate,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> Asignacion:
    await _evaluado_de_empresa(evaluado_id, tenant_id, db)
    slug = data.test_slug

    if slug not in engine.slugs_catalogo():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "El test no existe en el catálogo")

    # El test debe estar en alcance y habilitado para la empresa.
    hab = await db.execute(
        select(EmpresaTest).where(
            EmpresaTest.tenant_id == tenant_id,
            EmpresaTest.test_slug == slug,
            EmpresaTest.habilitado.is_(True),
        )
    )
    if hab.scalar_one_or_none() is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ese test no está habilitado para tu empresa")

    # No duplicar la asignación.
    dup = await db.execute(
        select(Asignacion).where(
            Asignacion.evaluado_id == evaluado_id, Asignacion.test_slug == slug
        )
    )
    if dup.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ese test ya está asignado a este evaluado")

    asignacion = Asignacion(tenant_id=tenant_id, evaluado_id=evaluado_id, test_slug=slug)
    db.add(asignacion)
    await db.flush()  # popula created_at vía RETURNING, dentro de la transacción con contexto RLS
    await db.commit()
    return asignacion


@router.delete("/asignaciones/{asignacion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def quitar_asignacion(
    asignacion_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    a = await db.get(Asignacion, asignacion_id)
    if a is None or a.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Asignación no encontrada")
    await db.delete(a)
    await db.commit()
