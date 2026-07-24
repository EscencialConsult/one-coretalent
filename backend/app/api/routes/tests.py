"""Endpoints del motor de tests: servir preguntas y calcular el resultado (lógica real)."""
from __future__ import annotations

import random
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.core import engine

router = APIRouter(prefix="/tests", tags=["tests"])


class CalcularIn(BaseModel):
    # Respuestas del evaluado. La forma depende del test (ej. Big Five: {"1": 5, "2": 3, ...}).
    respuestas: Dict[str, Any]


@router.get("/{slug}/preguntas")
async def obtener_preguntas(slug: str) -> dict:
    """Devuelve los reactivos para presentar el test (sin claves de corrección)."""
    try:
        data = engine.cargar_preguntas(slug)
    except FileNotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))

    # DISC (elección forzada, 28 grupos de 4 adjetivos): se eligen MÁS y MENOS por grupo.
    if "grupos" in data:
        grupos = [
            {"id": g["id"], "parte": g.get("parte"), "D": g["D"], "I": g["I"], "S": g["S"], "C": g["C"]}
            for g in data["grupos"]
        ]
        return {"slug": slug, "tipo": "disc", "dimensiones": data.get("dimensiones"), "grupos": grupos, "total": len(grupos)}

    # WAIS-IV (screening opción múltiple, 2 partes): se sirven ambas partes SIN la clave.
    if "parte1" in data:
        def _wais_item(it: dict) -> dict:
            return {
                "id": it["id"],
                "indice": it.get("indice"),
                "subtest": it.get("subtest"),
                "text": it.get("text") or it.get("texto") or "",
                "options": it.get("options", []),
            }
        p1 = [_wais_item(it) for it in data.get("parte1", [])]
        p2 = [_wais_item(it) for it in data.get("parte2", [])]
        return {
            "slug": slug,
            "tipo": "wais",
            "letras": data.get("letras", ["a", "b", "c", "d"]),
            "parte1": p1,
            "parte2": p2,
            "total": len(p1) + len(p2),
        }

    # Tests de tríadas (Kuder): cada ítem presenta 3 actividades; se elige la que MÁS y la que MENOS gusta.
    if "triadas" in data:
        triadas = [{"n": t["n"], "actividades": t["actividades"]} for t in data["triadas"]]
        return {"slug": slug, "tipo": "kuder", "triadas": triadas, "total": len(triadas)}

    items_raw = data.get("items", [])

    # Tests de CONOCIMIENTO (quiz): ítems con opciones y respuesta correcta. Se sirven N al
    # azar del pool y se OCULTA la clave (correct/explanation) para no filtrar las respuestas.
    if items_raw and "correct" in items_raw[0]:
        n = data.get("preguntas_por_intento", 20)
        seleccion = random.sample(items_raw, min(int(n), len(items_raw)))
        items = [
            {"id": it["id"], "question": it["question"], "options": it["options"], "category": it.get("category")}
            for it in seleccion
        ]
        return {"slug": slug, "tipo": "quiz", "nivel": data.get("nivel"), "items": items, "total": len(items)}

    # Tests de selección de ficha (Dominó): cada ítem es una secuencia + 6 opciones (pares de pips).
    if items_raw and "secuencia" in items_raw[0]:
        items = []
        for it in items_raw:
            opciones = [list(o) for o in it["opciones"]]
            random.shuffle(opciones)  # la clave NO debe quedar siempre primera
            items.append({"id": it["id"], "secuencia": it["secuencia"], "opciones": opciones})
        return {
            "slug": slug,
            "tipo": "domino",
            "items": items,
            "practica": data.get("practica", []),
            "total": len(items),
        }

    items = [
        {
            "id": it["id"],
            # El catálogo usa "text" o "texto" según el test; aceptamos ambos.
            "text": it.get("text") or it.get("texto") or "",
            "dimension": it.get("dimension") or it.get("subescala"),
            "tipo": it.get("tipo"),
        }
        for it in items_raw
    ]
    return {"slug": slug, "tipo": "likert", "escala": data.get("escala"), "items": items, "total": len(items)}


@router.post("/{slug}/calcular")
async def calcular_resultado(slug: str, data: CalcularIn) -> dict:
    """Calcula el resultado con el motor determinista del test (sin IA)."""
    try:
        return engine.calcular(slug, data.respuestas)
    except FileNotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    except Exception as e:  # noqa: BLE001 — devolver error claro durante desarrollo
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Error al calcular: {e}")
