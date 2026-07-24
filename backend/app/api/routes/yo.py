"""Portal del evaluado: sus tests asignados y el guardado de resultados."""
from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_evaluado
from app.core import engine
from app.core.db import get_db
from app.models.asignacion import Asignacion
from app.models.evaluado import Evaluado
from app.models.notificacion import Notificacion
from app.models.resultado import Resultado
from app.models.tenant import Empresa

router = APIRouter(prefix="/yo", tags=["evaluado"])


class ResultadoIn(BaseModel):
    respuestas: Dict[str, Any]


@router.get("/me")
async def yo_me(
    evaluado: Evaluado = Depends(get_current_evaluado),
    db: AsyncSession = Depends(get_db),
) -> dict:
    emp = await db.get(Empresa, evaluado.tenant_id)
    return {
        "id": str(evaluado.id),
        "nombre": evaluado.nombre,
        "apellido": evaluado.apellido,
        "email": evaluado.email,
        "empresa": {
            "razon_social": emp.razon_social,
            "logo_url": emp.logo_url,
            "color_acento": emp.color_acento,
            "color_secundario": emp.color_secundario,
        } if emp else None,
    }


@router.get("/asignaciones")
async def yo_asignaciones(
    evaluado: Evaluado = Depends(get_current_evaluado),
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    res = await db.execute(
        select(Asignacion).where(Asignacion.evaluado_id == evaluado.id).order_by(Asignacion.created_at)
    )
    asigs = list(res.scalars().all())
    cat = {t["slug"]: t for t in engine.listar_catalogo()}
    return [
        {
            "id": str(a.id),
            "test_slug": a.test_slug,
            "estado": a.estado,
            "nombre": cat.get(a.test_slug, {}).get("nombre", a.test_slug),
            "tomable": cat.get(a.test_slug, {}).get("tomable", False),
            "categoria": cat.get(a.test_slug, {}).get("categoria"),
            "n_items": cat.get(a.test_slug, {}).get("n_items"),
        }
        for a in asigs
    ]


@router.post("/asignaciones/{slug}/resultado")
async def yo_guardar_resultado(
    slug: str,
    data: ResultadoIn,
    evaluado: Evaluado = Depends(get_current_evaluado),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Calcula (motor determinista) y guarda el resultado; marca la asignación completada."""
    res = await db.execute(
        select(Asignacion).where(
            Asignacion.evaluado_id == evaluado.id, Asignacion.test_slug == slug
        )
    )
    asignacion = res.scalar_one_or_none()
    if asignacion is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No tenés asignado ese test")

    try:
        datos = engine.calcular(slug, data.respuestas)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Error al calcular: {e}")

    resultado = Resultado(
        tenant_id=evaluado.tenant_id,
        evaluado_id=evaluado.id,
        test_slug=slug,
        datos=datos,
    )
    db.add(resultado)
    await db.flush()  # obtiene resultado.id para el link del aviso

    cat = {t["slug"]: t["nombre"] for t in engine.listar_catalogo()}
    nombre_test = cat.get(slug, slug)
    db.add(
        Notificacion(
            tenant_id=evaluado.tenant_id,
            tipo="resultado_completado",
            mensaje=f"{evaluado.nombre} {evaluado.apellido} completó {nombre_test}",
            link=f"/empresa/informe/{resultado.id}",
        )
    )
    asignacion.estado = "completado"
    await db.commit()
    return {"ok": True}
