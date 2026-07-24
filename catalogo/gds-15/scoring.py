"""
Motor de cálculo DETERMINISTA — Escala de Depresión Geriátrica GDS-15.

Port fiel de Test19/index.html (lógica inline; script.gs estaba vacío 0 bytes).
Reproduce QUESTIONS_GDS + finishTest(): suma 1 punto por cada ítem cuya respuesta
coincide con la respuesta sintomática (depressionAnswer), y clasifica por los mismos
puntos de corte (0-4 normal, 5-8 leve, 9-11 moderada, 12-15 grave).
Sin IA: mismo input -> mismo output.

Entrada:  respuestas del evaluado por ítem (id 1-15), cada una 'si' o 'no'.
Salida:   puntuación total (0-15), nivel, interpretación y desglose.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Mapping

_DIR = Path(__file__).parent

with (_DIR / "preguntas.json").open(encoding="utf-8") as _f:
    _ITEMS = json.load(_f)["items"]
with (_DIR / "baremos.json").open(encoding="utf-8") as _f:
    _NIVELES = json.load(_f)["niveles"]
with (_DIR / "interpretaciones.json").open(encoding="utf-8") as _f:
    _INTERP = json.load(_f)["por_nivel"]

_SINTOMATICA = {it["id"]: it["respuesta_sintomatica"] for it in _ITEMS}
_IDS = [it["id"] for it in _ITEMS]
N_ITEMS = len(_ITEMS)


def _normalizar(respuestas: Mapping) -> dict[int, str]:
    """Acepta dict {id: 'si'|'no'}. Normaliza claves a int y valores a minúsculas."""
    norm: dict[int, str] = {}
    for k, v in respuestas.items():
        if v is None:
            continue
        val = str(v).strip().lower()
        if val == "":
            continue
        norm[int(k)] = val
    return norm


def _clasificar_nivel(puntuacion: int) -> dict:
    """Primer nivel (orden ascendente) cuyo 'max' >= puntuacion. Replica los if/else del legacy."""
    for nivel in _NIVELES:
        if puntuacion <= nivel["max"]:
            return nivel
    return _NIVELES[-1]


def calcular(respuestas: Mapping) -> dict:
    """Calcula el resultado GDS-15. respuestas: {id 1-15: 'si'|'no'}."""
    r = _normalizar(respuestas)

    # Suma de respuestas sintomáticas (port fiel del forEach de finishTest).
    puntuacion = sum(1 for qid in _IDS if r.get(qid) == _SINTOMATICA[qid])

    respondidas = sum(1 for qid in _IDS if qid in r)
    sin_responder = N_ITEMS - respondidas

    nivel = _clasificar_nivel(puntuacion)
    interp = _INTERP[nivel["nivel"]]

    return {
        "puntuacion_total": puntuacion,
        "nivel": nivel["nivel"],
        "nombre_nivel": nivel["nombre"],
        "badge": interp["badge"],
        "descripcion": interp["descripcion"],
        "recomendacion": interp["recomendacion"],
        "desglose": {
            "respondidas": respondidas,
            "sin_responder": sin_responder,
            "sintomaticas": puntuacion,
        },
    }


if __name__ == "__main__":
    import pprint

    pprint.pprint(calcular({i: "no" for i in range(1, 16)}))
