"""
Motor de cálculo DETERMINISTA — DNLA Leadership & Middle Management (40 ítems).

Port fiel de Test12/index.html (la lógica de scoring vive INLINE en index.html;
el script.gs del legacy está vacío). Funciones portadas:
  - calculateAndDisplayResults  -> promedio por dimensión + promedio global
  - getDimensionAnalysis        -> nivel/label/badge/descripción por dimensión
  - getGlobalAnalysis           -> nivel/label/color/interpretación global
  - displayProfileSynthesis     -> fortalezas / debilidades / recomendación

Sin IA: mismo input -> mismo output. Lógica aprobada, no se altera.

Entrada:  respuestas del evaluado por ítem (id 1-40) en escala 1-5 (5=Siempre ... 1=Nunca).
          No hay ítems inversos: todos puntúan en sentido directo.
Salida:   por dimensión -> promedio (1-5, 2 decimales), nivel, label, badge, descripción;
          promedio global con nivel/label/color/interpretación; y síntesis del perfil.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Mapping, Sequence

_DIR = Path(__file__).parent

with (_DIR / "preguntas.json").open(encoding="utf-8") as _f:
    _ITEMS = json.load(_f)["items"]
with (_DIR / "interpretaciones.json").open(encoding="utf-8") as _f:
    _INTERP = json.load(_f)
    _POR_DIM = _INTERP["por_dimension"]
    _NIVELES_DIM = _INTERP["niveles_dimension"]["umbral_descendente"]
    _NIVELES_GLOBAL = _INTERP["niveles_global"]["umbral_descendente"]
    _SINTESIS = _INTERP["sintesis"]

# Orden de dimensiones tal cual el objeto `dimensions` del index.html (preserva
# el orden de inserción usado para el radar y las tarjetas).
DIMENSIONES = [
    "vision_estrategica",
    "comunicacion",
    "decision",
    "motivacion",
    "conflictos",
    "resiliencia",
    "innovacion",
    "autogestion",
]

NOMBRES = {
    "vision_estrategica": "Visión Estratégica",
    "comunicacion": "Comunicación",
    "decision": "Decisión",
    "motivacion": "Motivación",
    "conflictos": "Conflictos",
    "resiliencia": "Resiliencia",
    "innovacion": "Innovación",
    "autogestion": "Autogestión",
}

_ITEMS_POR_DIM = {d: [it["id"] for it in _ITEMS if it["dimension"] == d] for d in DIMENSIONES}


def _round_half_up(x: float) -> int:
    """Replica JS Math.round (half-up) para valores no negativos."""
    return math.floor(x + 0.5)


def _to_fixed_2(x: float) -> float:
    """Replica Number.prototype.toFixed(2) -> número con 2 decimales (half-up).

    En este test los promedios de dimensión son múltiplos exactos de 0.2
    (suma de 5 enteros / 5), por lo que no hay ambigüedad de redondeo a 2
    decimales. El promedio global (media de 8 promedios) sí puede requerir
    redondeo; se aplica half-up igual que toFixed para estos rangos.
    """
    return _round_half_up(x * 100) / 100


def _normalizar(respuestas: Mapping[int, int] | Sequence[int]) -> dict[int, int]:
    """Acepta dict {id: valor} o lista de 40 valores (posición 0 = ítem 1)."""
    if isinstance(respuestas, Mapping):
        return {int(k): int(v) for k, v in respuestas.items()}
    return {i + 1: int(v) for i, v in enumerate(respuestas)}


def _clasificar_dim(score: float) -> dict:
    for u in _NIVELES_DIM:
        if score >= u["min_score"]:
            return u
    return _NIVELES_DIM[-1]


def _clasificar_global(score: float) -> dict:
    for u in _NIVELES_GLOBAL:
        if score >= u["min_score"]:
            return u
    return _NIVELES_GLOBAL[-1]


def calcular(respuestas: Mapping[int, int] | Sequence[int]) -> dict:
    """Calcula el perfil de liderazgo DNLA. respuestas: {id 1-40: valor 1-5} o lista de 40."""
    r = _normalizar(respuestas)

    dimensiones = {}
    suma_promedios_crudos = 0.0  # totalSum: usa los promedios SIN redondear (como el index.html)

    for d in DIMENSIONES:
        ids = _ITEMS_POR_DIM[d]
        suma = sum(r.get(i, 0) for i in ids)
        count = len(ids)
        avg_crudo = suma / count
        suma_promedios_crudos += avg_crudo

        score = _to_fixed_2(avg_crudo)  # dimensionScores[dim] = parseFloat(avg.toFixed(2))
        nivel = _clasificar_dim(score)
        dimensiones[d] = {
            "nombre": NOMBRES[d],
            "suma": suma,
            "puntuacion": score,
            "nivel": nivel["nivel"],
            "label": nivel["label"],
            "badge": nivel["badge"],
            "descripcion": _POR_DIM[d][nivel["nivel"]],
        }

    promedio_global = _to_fixed_2(suma_promedios_crudos / len(DIMENSIONES))
    g = _clasificar_global(promedio_global)

    # Síntesis (displayProfileSynthesis): usa los puntajes ya redondeados.
    u_fort = _SINTESIS["umbral_fortaleza"]
    u_deb = _SINTESIS["umbral_debilidad"]
    fortalezas = [NOMBRES[d] for d in DIMENSIONES if dimensiones[d]["puntuacion"] >= u_fort]
    debilidades = [NOMBRES[d] for d in DIMENSIONES if dimensiones[d]["puntuacion"] < u_deb]

    return {
        "dimensiones": dimensiones,
        "global": {
            "puntuacion": promedio_global,
            "label": g["label"],
            "color": g["color"],
            "interpretation": g["interpretation"],
            "recomendacion": g["recomendacion"],
        },
        "sintesis": {
            "fortalezas": fortalezas,
            "debilidades": debilidades,
        },
    }


if __name__ == "__main__":
    import pprint

    pprint.pprint(calcular({i: 3 for i in range(1, 41)}))
