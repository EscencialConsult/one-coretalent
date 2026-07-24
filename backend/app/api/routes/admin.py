"""Métricas globales para el panel SuperAdmin (dashboard) + aprobación de empresas
auto-registradas (ver publico.py:registro_empresa)."""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_superadmin
from app.core import engine
from app.core.db import get_db
from app.core.storage import url_firmada
from app.models.empresa_test import EmpresaTest  # noqa: F401 (asegura metadata)
from app.models.enums import EstadoEmpresa
from app.models.evaluado import Evaluado
from app.models.resultado import Resultado
from app.models.tenant import Empresa

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_superadmin)])


@router.get("/resumen")
async def resumen(db: AsyncSession = Depends(get_db)) -> dict:
    empresas = (await db.execute(select(func.count()).select_from(Empresa))).scalar() or 0
    activas = (
        await db.execute(
            select(func.count()).select_from(Empresa).where(Empresa.estado == EstadoEmpresa.ACTIVO)
        )
    ).scalar() or 0
    evaluados = (await db.execute(select(func.count()).select_from(Evaluado))).scalar() or 0
    resultados = (await db.execute(select(func.count()).select_from(Resultado))).scalar() or 0

    cat = engine.listar_catalogo()
    catmap = {t["slug"]: t["nombre"] for t in cat}
    rows = (
        await db.execute(
            select(Resultado.test_slug, func.count().label("n"))
            .group_by(Resultado.test_slug)
            .order_by(func.count().desc())
            .limit(5)
        )
    ).all()
    top = [{"slug": s, "nombre": catmap.get(s, s), "n": n} for s, n in rows]

    return {
        "empresas": empresas,
        "empresas_activas": activas,
        "evaluados": evaluados,
        "resultados": resultados,
        "tests_catalogo": len(cat),
        "tests_tomables": sum(1 for t in cat if t.get("tomable")),
        "tests_mas_usados": top,
    }


# ── Aprobación de empresas auto-registradas (ver publico.py:registro_empresa) ─────────────
async def _get_empresa_pendiente(empresa_id: uuid.UUID, db: AsyncSession) -> Empresa:
    empresa = await db.get(Empresa, empresa_id)
    if empresa is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa no encontrada")
    if empresa.estado != EstadoEmpresa.PENDIENTE_VERIFICACION:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Esta empresa no está pendiente de verificación")
    return empresa


@router.get("/empresas-pendientes")
async def listar_empresas_pendientes(db: AsyncSession = Depends(get_db)) -> List[dict]:
    """Empresas auto-registradas esperando revisión manual — igual que admin.html legacy,
    la verificación automática solo chequea formato (DNI de 8 dígitos, archivos presentes),
    la aprobación real la hace siempre una persona."""
    res = await db.execute(
        select(Empresa)
        .where(Empresa.estado == EstadoEmpresa.PENDIENTE_VERIFICACION)
        .order_by(Empresa.created_at)
    )
    empresas = list(res.scalars().all())
    salida = []
    for e in empresas:
        salida.append(
            {
                "id": str(e.id),
                "razon_social": e.razon_social,
                "subdominio": e.subdominio,
                "email_admin": e.email_admin,
                "cuit": e.cuit,
                "rubro": e.rubro,
                "dni": e.dni,
                "selfie_url": await url_firmada(e.selfie_url) if e.selfie_url else None,
                "firma_legal_url": await url_firmada(e.firma_legal_url) if e.firma_legal_url else None,
                "dni_frente_url": await url_firmada(e.dni_frente_url) if e.dni_frente_url else None,
                "dni_dorso_url": await url_firmada(e.dni_dorso_url) if e.dni_dorso_url else None,
                "created_at": e.created_at.isoformat(),
            }
        )
    return salida


@router.post("/empresas-pendientes/{empresa_id}/aprobar")
async def aprobar_empresa(empresa_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> dict:
    empresa = await _get_empresa_pendiente(empresa_id, db)
    empresa.nombre_verificado = empresa.razon_social
    empresa.estado = EstadoEmpresa.ACTIVO
    await db.commit()
    return {"ok": True, "estado": empresa.estado.value}


@router.post("/empresas-pendientes/{empresa_id}/rechazar")
async def rechazar_empresa(empresa_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> dict:
    empresa = await _get_empresa_pendiente(empresa_id, db)
    empresa.estado = EstadoEmpresa.RECHAZADA
    await db.commit()
    return {"ok": True, "estado": empresa.estado.value}
