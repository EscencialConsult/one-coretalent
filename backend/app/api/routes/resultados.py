"""Resultados de los evaluados, vistos por el Admin de Empresa (aislado por empresa)."""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ActorActual, get_current_actor, get_current_tenant_id
from app.core import engine
from app.core.db import get_db
from app.models.evaluado import Evaluado
from app.models.resultado import Resultado
from app.models.tenant import Empresa
from app.models.evaluacion_postulante import EventoEvaluacion
from app.models.asignacion import Asignacion
from app.models.postulacion import Postulacion
from app.models.vacante import Vacante

router = APIRouter(tags=["resultados (empresa)"])

_INFORMES_EXCLUIDOS = {
    "excel-inicial", "excel-intermedio", "excel-avanzado", "informe-integral-ia"
}
_CLAVES_SENSIBLES = {
    "respuesta", "respuestas", "respuestas_crudas", "raw_answers", "items",
    "claves", "clave_correccion",
}


def _sin_respuestas_crudas(valor):
    """Defensa en profundidad: el contrato de informe jamás transporta reactivos respondidos."""
    if isinstance(valor, dict):
        return {
            clave: _sin_respuestas_crudas(contenido)
            for clave, contenido in valor.items()
            if clave.lower() not in _CLAVES_SENSIBLES
        }
    if isinstance(valor, list):
        return [_sin_respuestas_crudas(item) for item in valor]
    return valor


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
    actor: ActorActual = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> dict:
    r = await db.get(Resultado, resultado_id)
    if r is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Resultado no encontrado")
    if actor.tipo == "persona" and r.persona_id != actor.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Resultado no encontrado")
    tenant_id = actor.tenant_id or r.tenant_id
    ev = await db.get(Evaluado, r.evaluado_id)
    emp = await db.get(Empresa, tenant_id)
    cat = {t["slug"]: t for t in engine.listar_catalogo()}
    db.add(
        EventoEvaluacion(
            tenant_id=tenant_id,
            persona_id=r.persona_id,
            actor_tipo=actor.tipo,
            actor_id=actor.id,
            accion="resultado_consultado",
            resultado_id=r.id,
            detalle={"test_slug": r.test_slug},
        )
    )
    await db.commit()
    return {
        "id": str(r.id),
        "test_slug": r.test_slug,
        "test_nombre": cat.get(r.test_slug, {}).get("nombre", r.test_slug),
        "datos": r.datos,
        "catalogo_version": r.catalogo_version,
        "algoritmo_version": r.algoritmo_version,
        "created_at": r.created_at.isoformat(),
        "evaluado": {"nombre": ev.nombre, "apellido": ev.apellido} if ev else None,
        "empresa": {
            "razon_social": emp.razon_social,
            "logo_url": emp.logo_url,
            "color_acento": emp.color_acento,
            "color_secundario": emp.color_secundario,
        } if emp else None,
    }


@router.get("/informes/{resultado_id}")
async def obtener_informe(
    resultado_id: uuid.UUID,
    actor: ActorActual = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Entrega exclusivamente resultados ya calculados y metadatos aptos para presentación."""
    resultado = await db.get(Resultado, resultado_id)
    if resultado is None or resultado.test_slug in _INFORMES_EXCLUIDOS:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Informe no disponible")
    if actor.tipo == "persona" and resultado.persona_id != actor.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Informe no disponible")

    evaluado = await db.get(Evaluado, resultado.evaluado_id)
    tenant_marca = actor.tenant_id or resultado.tenant_id
    empresa = await db.get(Empresa, tenant_marca)
    contexto = None
    asignacion = (
        await db.execute(
            select(Asignacion)
            .where(
                Asignacion.persona_id == resultado.persona_id,
                Asignacion.test_slug == resultado.test_slug,
                Asignacion.estado == "completado",
            )
            .order_by(Asignacion.finalizada_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    if asignacion and asignacion.postulacion_id:
        postulacion = await db.get(Postulacion, asignacion.postulacion_id)
        vacante = await db.get(Vacante, postulacion.vacante_id) if postulacion else None
        if vacante:
            contexto = {"tipo": "seleccion", "puesto": vacante.puesto}

    catalogo = {item["slug"]: item for item in engine.listar_catalogo()}
    config = engine.cargar_informe(resultado.test_slug)
    db.add(EventoEvaluacion(
        tenant_id=tenant_marca,
        persona_id=resultado.persona_id,
        actor_tipo=actor.tipo,
        actor_id=actor.id,
        accion="informe_sensible_consultado",
        resultado_id=resultado.id,
        detalle={"test_slug": resultado.test_slug, "vista": actor.tipo},
    ))
    await db.commit()
    return {
        "id": str(resultado.id),
        "test_slug": resultado.test_slug,
        "test_nombre": catalogo.get(resultado.test_slug, {}).get("nombre", resultado.test_slug),
        "fecha": resultado.created_at.isoformat(),
        "catalogo_version": resultado.catalogo_version,
        "algoritmo_version": resultado.algoritmo_version,
        "contexto": contexto,
        "audiencia": actor.tipo,
        "evaluado": (
            {"nombre": evaluado.nombre, "apellido": evaluado.apellido}
            if evaluado else None
        ),
        "empresa": ({
            "razon_social": empresa.razon_social,
            "logo_url": empresa.logo_url,
            "color_acento": empresa.color_acento,
            "color_secundario": empresa.color_secundario,
        } if empresa else None),
        "configuracion": config,
        "resultado": _sin_respuestas_crudas(resultado.datos),
        "aviso": (
            "Este informe describe resultados del instrumento aplicado en su contexto. "
            "No constituye por sí solo un diagnóstico clínico ni una decisión de selección."
        ),
    }
