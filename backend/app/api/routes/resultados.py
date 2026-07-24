"""Resultados de los evaluados, vistos por el Admin de Empresa (aislado por empresa)."""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant_id
from app.core import engine
from app.core.db import get_db
from app.models.evaluado import Evaluado
from app.models.resultado import Resultado
from app.models.tenant import Empresa

router = APIRouter(tags=["resultados (empresa)"])


@router.get("/evaluados/{evaluado_id}/resultados")
async def listar_resultados(
    evaluado_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    ev = await db.get(Evaluado, evaluado_id)
    if ev is None or ev.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Evaluado no encontrado")
    res = await db.execute(
        select(Resultado).where(Resultado.evaluado_id == evaluado_id).order_by(Resultado.created_at.desc())
    )
    filas = list(res.scalars().all())
    cat = {t["slug"]: t for t in engine.listar_catalogo()}
    return [
        {
            "id": str(r.id),
            "test_slug": r.test_slug,
            "nombre": cat.get(r.test_slug, {}).get("nombre", r.test_slug),
            "created_at": r.created_at.isoformat(),
        }
        for r in filas
    ]


@router.get("/resultados/{resultado_id}")
async def obtener_resultado(
    resultado_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    r = await db.get(Resultado, resultado_id)
    if r is None or r.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Resultado no encontrado")
    ev = await db.get(Evaluado, r.evaluado_id)
    emp = await db.get(Empresa, tenant_id)
    cat = {t["slug"]: t for t in engine.listar_catalogo()}
    return {
        "id": str(r.id),
        "test_slug": r.test_slug,
        "test_nombre": cat.get(r.test_slug, {}).get("nombre", r.test_slug),
        "datos": r.datos,
        "created_at": r.created_at.isoformat(),
        "evaluado": {"nombre": ev.nombre, "apellido": ev.apellido} if ev else None,
        "empresa": {
            "razon_social": emp.razon_social,
            "logo_url": emp.logo_url,
            "color_acento": emp.color_acento,
            "color_secundario": emp.color_secundario,
        } if emp else None,
    }
