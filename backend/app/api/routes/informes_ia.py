"""Informes gerenciales integrales con IA (Admin de Empresa, aislado por empresa).

El admin elige varios resultados YA calculados de un evaluado y la IA los integra en
un único informe. La IA nunca altera los resultados (ver app/core/ia.py).
"""
from __future__ import annotations

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant_id
from app.core import engine, ia
from app.core.config import settings
from app.core.db import get_db
from app.models.evaluado import Evaluado
from app.models.informe_integral import InformeIntegral
from app.models.resultado import Resultado
from app.models.tenant import Empresa

router = APIRouter(prefix="/empresa", tags=["informes IA (empresa)"])


class GenerarInformeIn(BaseModel):
    resultado_ids: List[uuid.UUID] = Field(..., min_length=1)
    titulo: Optional[str] = None


@router.get("/ia/estado")
async def estado_ia() -> dict:
    """Para que la UI sepa si puede ofrecer la generación."""
    return {"habilitada": settings.ia_habilitada, "modelo": settings.OPENAI_MODEL}


async def _evaluado_del_tenant(evaluado_id: uuid.UUID, tenant_id: uuid.UUID, db: AsyncSession) -> Evaluado:
    ev = await db.get(Evaluado, evaluado_id)
    if ev is None or ev.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Evaluado no encontrado")
    return ev


def _fila_resumen(inf: InformeIntegral) -> dict:
    return {
        "id": str(inf.id),
        "titulo": inf.titulo,
        "tests": inf.tests,
        "modelo": inf.modelo,
        "created_at": inf.created_at.isoformat(),
    }


@router.get("/evaluados/{evaluado_id}/informes-integrales")
async def listar_informes(
    evaluado_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    await _evaluado_del_tenant(evaluado_id, tenant_id, db)
    res = await db.execute(
        select(InformeIntegral)
        .where(InformeIntegral.evaluado_id == evaluado_id)
        .order_by(InformeIntegral.created_at.desc())
    )
    return [_fila_resumen(i) for i in res.scalars().all()]


@router.post("/evaluados/{evaluado_id}/informe-integral", status_code=status.HTTP_201_CREATED)
async def generar_informe(
    evaluado_id: uuid.UUID,
    body: GenerarInformeIn,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if not settings.ia_habilitada:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La IA no está configurada. Cargá la API key de OpenAI.")
    ev = await _evaluado_del_tenant(evaluado_id, tenant_id, db)

    # Traer los resultados pedidos, validando que sean de este evaluado y empresa.
    res = await db.execute(
        select(Resultado).where(
            Resultado.id.in_(body.resultado_ids),
            Resultado.evaluado_id == evaluado_id,
            Resultado.tenant_id == tenant_id,
        )
    )
    resultados = list(res.scalars().all())
    if len(resultados) != len(set(body.resultado_ids)):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Algún resultado no existe o no pertenece a este evaluado.")

    cat = {t["slug"]: t for t in engine.listar_catalogo()}
    tests_payload = [
        {
            "nombre": cat.get(r.test_slug, {}).get("nombre", r.test_slug),
            "categoria": cat.get(r.test_slug, {}).get("categoria"),
            "datos": r.datos,
        }
        for r in resultados
    ]
    snapshot = [
        {"resultado_id": str(r.id), "slug": r.test_slug, "nombre": cat.get(r.test_slug, {}).get("nombre", r.test_slug)}
        for r in resultados
    ]

    emp = await db.get(Empresa, tenant_id)
    nombre_ev = f"{ev.nombre} {ev.apellido}".strip()
    try:
        contenido = await ia.generar_informe_integral(
            evaluado=nombre_ev,
            empresa=emp.razon_social if emp else "la empresa",
            tests=tests_payload,
            tipo_evaluado=ev.tipo,
        )
    except Exception as e:  # noqa: BLE001
        msg = str(e)
        if "insufficient_quota" in msg or "exceeded your current quota" in msg:
            raise HTTPException(
                status.HTTP_402_PAYMENT_REQUIRED,
                "La IA no tiene saldo disponible en OpenAI en este momento. "
                "Cargá crédito en la cuenta de OpenAI para habilitar la generación.",
            )
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"No se pudo generar el informe: {e}")

    titulo = (body.titulo or contenido.get("titulo") or f"Informe integral · {nombre_ev}").strip()[:200]
    inf = InformeIntegral(
        tenant_id=tenant_id,
        evaluado_id=evaluado_id,
        titulo=titulo,
        tests=snapshot,
        contenido=contenido,
        modelo=settings.OPENAI_MODEL,
    )
    db.add(inf)
    await db.flush()  # popula id/created_at vía RETURNING, dentro de la transacción con contexto RLS
    await db.commit()
    return {**_fila_resumen(inf), "contenido": inf.contenido}


@router.get("/informes-integrales/{informe_id}")
async def obtener_informe(
    informe_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    inf = await db.get(InformeIntegral, informe_id)
    if inf is None or inf.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Informe no encontrado")
    ev = await db.get(Evaluado, inf.evaluado_id)
    emp = await db.get(Empresa, tenant_id)
    return {
        **_fila_resumen(inf),
        "contenido": inf.contenido,
        "evaluado": {"nombre": ev.nombre, "apellido": ev.apellido} if ev else None,
        "empresa": {
            "razon_social": emp.razon_social,
            "logo_url": emp.logo_url,
            "color_acento": emp.color_acento,
            "color_secundario": emp.color_secundario,
        } if emp else None,
    }


@router.delete("/informes-integrales/{informe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def borrar_informe(
    informe_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    inf = await db.get(InformeIntegral, informe_id)
    if inf is None or inf.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Informe no encontrado")
    await db.delete(inf)
    await db.commit()
