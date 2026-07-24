"""
Motor de cálculo DETERMINISTA — Big Five (IPIP-50).

Port fiel de Test6/script.gs (invertirItems / calcularPuntuaciones / calcularPercentil /
clasificarNivel). Sin IA: mismo input -> mismo output. Lógica aprobada, no se altera.

Entrada:  respuestas del evaluado por ítem (id 1-50) en escala 1-5.
Salida:   por dimensión -> puntuación (10-50), percentil, nivel e interpretación; + dimensión dominante.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Mapping, Sequence

_DIR = Path(__file__).parent

with (_DIR / "preguntas.json").open(encoding="utf-8") as _f:
    _ITEMS = json.load(_f)["items"]
with (_DIR / "normas.json").open(encoding="utf-8") as _f:
    _N = json.load(_f)
    _NORMAS = {d: {int(k): v for k, v in tabla.items()} for d, tabla in _N["normas"].items()}
    _NOMBRES = _N["nombres"]
    _PROMEDIOS = _N["promedios"]
    _NIVELES = _N["niveles"]["umbral_descendente"]
with (_DIR / "interpretaciones.json").open(encoding="utf-8") as _f:
    _INTERP = json.load(_f)["por_dimension"]

DIMENSIONES = ["extraversion", "agreeableness", "conscientiousness", "neuroticism", "openness"]
_ITEMS_POR_DIM = {d: [it for it in _ITEMS if it["dimension"] == d] for d in DIMENSIONES}
_REVERSE_IDS = {it["id"] for it in _ITEMS if it["reverse"]}
_ANCLAS = [5, 10, 25, 50, 75, 90, 95]


def _round_half_up(x: float) -> int:
    """Replica JS Math.round (half-up) para valores no negativos."""
    return math.floor(x + 0.5)


def _normalizar(respuestas: Mapping[int, int] | Sequence[int]) -> dict[int, int]:
    """Acepta dict {id: valor} o lista de 50 valores (posición 0 = ítem 1)."""
    if isinstance(respuestas, Mapping):
        return {int(k): int(v) for k, v in respuestas.items()}
    return {i + 1: int(v) for i, v in enumerate(respuestas)}


def _percentil(puntuacion: int, dimension: str) -> int:
    norma = _NORMAS[dimension]
    if puntuacion <= norma[5]:
        return max(1, _round_half_up(puntuacion / norma[5] * 5))
    if puntuacion >= norma[95]:
        return min(99, 95 + _round_half_up((puntuacion - norma[95]) / 5))
    for i in range(len(_ANCLAS) - 1):
        p_bajo, p_alto = _ANCLAS[i], _ANCLAS[i + 1]
        if norma[p_bajo] <= puntuacion <= norma[p_alto]:
            ratio = (puntuacion - norma[p_bajo]) / (norma[p_alto] - norma[p_bajo])
            return _round_half_up(p_bajo + ratio * (p_alto - p_bajo))
    return 50


def _clasificar_nivel(percentil: int) -> dict:
    for u in _NIVELES:
        if percentil >= u["min_percentil"]:
            return u
    return _NIVELES[-1]


def calcular(respuestas: Mapping[int, int] | Sequence[int]) -> dict:
    """Calcula el perfil Big Five. respuestas: {id 1-50: valor 1-5} o lista de 50."""
    r = _normalizar(respuestas)
    # Invertir ítems reverse: valor -> 6 - valor.
    procesadas = {i: (6 - v if i in _REVERSE_IDS else v) for i, v in r.items()}

    dimensiones = {}
    for d in DIMENSIONES:
        puntuacion = sum(procesadas.get(it["id"], 0) for it in _ITEMS_POR_DIM[d])
        percentil = _percentil(puntuacion, d)
        nivel = _clasificar_nivel(percentil)
        interp = _INTERP[d][nivel["nivel"]]
        dimensiones[d] = {
            "nombre": _NOMBRES[d],
            "puntuacion": puntuacion,
            "promedio_poblacional": _PROMEDIOS[d],
            "percentil": percentil,
            "nivel": nivel["nivel"],
            "nombre_nivel": nivel["nombre"],
            "descripcion": interp["descripcion"],
            "fortalezas": interp["fortalezas"],
            "areas": interp["areas"],
            "profesional": interp["profesional"],
        }

    dominante = max(dimensiones, key=lambda d: dimensiones[d]["percentil"])
    return {"dimensiones": dimensiones, "dimension_dominante": dominante}


if __name__ == "__main__":
    import pprint

    pprint.pprint(calcular({i: 3 for i in range(1, 51)}))
