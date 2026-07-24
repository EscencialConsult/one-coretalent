"""Scoring determinista de un test de CONOCIMIENTO (quiz de opción múltiple).

A diferencia de los tests psicométricos, acá hay respuesta correcta/incorrecta.
Se puntúa por % de aciertos, con desglose por categoría y una revisión ítem por ítem.
Sin IA: mismo input -> mismo output.

Entrada: respuestas = { "<id>": <indice_opcion_elegida>, ... } (solo las preguntas
que se le presentaron al evaluado; el server sirve 20 al azar del pool).
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Mapping

_DIR = Path(__file__).parent

with (_DIR / "preguntas.json").open(encoding="utf-8") as _f:
    _DATA = json.load(_f)

_NIVEL = _DATA.get("nivel", "")
_ITEMS = {int(it["id"]): it for it in _DATA.get("items", [])}


def _banda(pct: float) -> tuple[str, str]:
    if pct >= 90:
        return "excelente", "¡Excelente! Domina este nivel."
    if pct >= 70:
        return "muy_bien", "¡Muy bien! Tiene buenos conocimientos."
    if pct >= 50:
        return "bien", "Bien, pero puede mejorar."
    return "insuficiente", "Necesita practicar más."


def calcular(respuestas: Mapping[str, Any]) -> dict:
    revision: list[dict] = []
    por_cat: dict[str, dict[str, int]] = {}
    correctos = 0

    # Ordenamos por id para una revisión estable.
    ids = sorted((int(k) for k in respuestas), key=int)
    for n, qid in enumerate(ids, start=1):
        it = _ITEMS.get(qid)
        if it is None:
            continue  # id que no pertenece al pool: se ignora
        elegida = respuestas.get(str(qid), respuestas.get(qid))
        try:
            elegida = int(elegida)
        except (TypeError, ValueError):
            elegida = -1
        correcta = int(it["correct"])
        opciones = it.get("options", [])
        es_correcta = elegida == correcta
        if es_correcta:
            correctos += 1

        cat = it.get("category") or "General"
        c = por_cat.setdefault(cat, {"correctos": 0, "total": 0})
        c["total"] += 1
        if es_correcta:
            c["correctos"] += 1

        revision.append({
            "n": n,
            "id": qid,
            "pregunta": it.get("question", ""),
            "opciones": opciones,
            "elegida_idx": elegida,
            "elegida_texto": opciones[elegida] if 0 <= elegida < len(opciones) else "(sin responder)",
            "correcta_idx": correcta,
            "correcta_texto": opciones[correcta] if 0 <= correcta < len(opciones) else "",
            "es_correcta": es_correcta,
            "explicacion": it.get("explanation", ""),
            "categoria": cat,
        })

    total = len(revision)
    pct = round((correctos / total) * 100) if total else 0
    banda, mensaje = _banda(pct)

    por_categoria = [
        {
            "categoria": cat,
            "correctos": v["correctos"],
            "total": v["total"],
            "porcentaje": round((v["correctos"] / v["total"]) * 100) if v["total"] else 0,
        }
        for cat, v in sorted(por_cat.items())
    ]

    return {
        "tipo": "quiz",
        "nivel": _NIVEL,
        "total": total,
        "correctos": correctos,
        "incorrectos": total - correctos,
        "porcentaje": pct,
        "banda": banda,
        "mensaje": mensaje,
        "por_categoria": por_categoria,
        "revision": revision,
    }
