"""
Motor de cálculo DETERMINISTA — Bar-On EQ-i (133 ítems, escala 2-6).

Port fiel de Test17/script.gs (calcularResultados / clasificarNivel). El script.gs es la
AUTORIDAD del scoring (el index.html tiene una lógica inline DISTINTA y obsoleta: otros
umbrales de nivel y otras interpretaciones; ver ANALISIS.md). Sin IA: mismo input -> mismo
output. Lógica aprobada, no se altera.

Entrada:  respuestas del evaluado por ítem (id 1-133) en escala 2-6.
Salida:   15 subescalas + 5 escalas compuestas + CE Total (cada una con puntajeBruto,
          porcentaje 0-100 redondeado a 1 decimal y nivel) + top-5 fortalezas/debilidades
          de subescalas + interpretaciones de compuestas y CE Total.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Mapping, Sequence

_DIR = Path(__file__).parent

with (_DIR / "baremos.json").open(encoding="utf-8") as _f:
    _B = json.load(_f)
    _SUBESCALAS = _B["subescalas"]
    _ORDEN_SUB = _SUBESCALAS["_orden_salida"]
    _COMPUESTAS = _B["escalas_compuestas"]
    _ORDEN_COMP = _COMPUESTAS["_orden_salida"]
    _CE_TOTAL = _B["ce_total"]
    _NIVELES = _B["niveles"]["umbral_descendente"]
with (_DIR / "interpretaciones.json").open(encoding="utf-8") as _f:
    _INTERP = json.load(_f)
    _INTERP_CE = _INTERP["ce_total"]
    _INTERP_COMP = _INTERP["por_escala_compuesta"]

N_ITEMS = 133
RANGO_MIN, RANGO_MAX = 2, 6


def _round_half_up(x: float) -> int:
    """Replica JS Math.round (half-up) para valores no negativos."""
    return math.floor(x + 0.5)


def _round1(x: float) -> float:
    """Replica JS `Math.round(x * 10) / 10` (1 decimal, half-up)."""
    return _round_half_up(x * 10) / 10


def _normalizar(respuestas: Mapping[int, int] | Sequence[int]) -> dict[int, int]:
    """Acepta dict {id: valor} o lista de 133 valores (posición 0 = ítem 1)."""
    if isinstance(respuestas, Mapping):
        return {int(k): int(v) for k, v in respuestas.items()}
    return {i + 1: int(v) for i, v in enumerate(respuestas)}


def _porcentaje(suma: float, n_items: int) -> float:
    """pct = ((suma - min) / (max - min)) * 100, min=n*2, max=n*6. (Sin clamp, como el .gs.)"""
    minimo = n_items * RANGO_MIN
    maximo = n_items * RANGO_MAX
    return ((suma - minimo) / (maximo - minimo)) * 100


def clasificar_nivel(porcentaje: float) -> dict:
    """clasificarNivel(porcentaje) del .gs, sobre el porcentaje SIN redondear."""
    for u in _NIVELES:
        if porcentaje >= u["min_pct"]:
            return u
    return _NIVELES[-1]


def calcular(respuestas: Mapping[int, int] | Sequence[int]) -> dict:
    """Calcula el perfil Bar-On EQ-i. respuestas: {id 1-133: valor 2-6} o lista de 133."""
    r = _normalizar(respuestas)

    # --- Subescalas ---
    subescalas = {}
    for code in _ORDEN_SUB:
        sub = _SUBESCALAS[code]
        items = sub["items"]
        suma = sum(r.get(it, 0) for it in items)
        pct = _porcentaje(suma, len(items))
        subescalas[code] = {
            "nombre": sub["nombre"],
            "puntajeBruto": suma,
            "porcentaje": _round1(pct),
            "nivel": clasificar_nivel(pct)["nivel"],
            "numItems": len(items),
        }

    # --- Escalas compuestas ---
    compuestas = {}
    for code in _ORDEN_COMP:
        comp = _COMPUESTAS[code]
        suma = 0
        total_items = 0
        for sc in comp["subescalas"]:
            suma += subescalas[sc]["puntajeBruto"]
            total_items += subescalas[sc]["numItems"]
        # Resta especial (solo CEIE en el .gs).
        for it in comp.get("itemsResta", []):
            suma -= r.get(it, 0)
        pct = _porcentaje(suma, total_items)
        compuestas[code] = {
            "nombre": comp["nombre"],
            "descripcion": comp["descripcion"],
            "puntajeBruto": suma,
            "porcentaje": _round1(pct),
            "nivel": clasificar_nivel(pct)["nivel"],
            "subescalas": list(comp["subescalas"]),
            "interpretacion": _INTERP_COMP[code][clasificar_nivel(pct)["nivel"]],
        }

    # --- CE Total ---
    ce_total = sum(compuestas[c]["puntajeBruto"] for c in _ORDEN_COMP)
    for it in _CE_TOTAL["itemsRestaCETotal"]:
        ce_total -= abs(r.get(it, 0))
    ce_pct = _porcentaje(ce_total, _CE_TOTAL["n_items_normalizacion"])
    ce_nivel = clasificar_nivel(ce_pct)["nivel"]

    # --- Fortalezas / debilidades (top-5 subescalas por porcentaje) ---
    todas = [{"codigo": c, **subescalas[c]} for c in _ORDEN_SUB]
    # sort estable descendente por porcentaje (replica .sort((a,b)=>b.pct-a.pct))
    ordenadas = sorted(todas, key=lambda s: s["porcentaje"], reverse=True)
    fortalezas = ordenadas[:5]
    debilidades = list(reversed(ordenadas[-5:]))

    return {
        "ceTotal": {
            "puntajeBruto": ce_total,
            "porcentaje": _round1(ce_pct),
            "nivel": ce_nivel,
            "interpretacion": _INTERP_CE[ce_nivel],
        },
        "compuestas": compuestas,
        "subescalas": subescalas,
        "fortalezas": fortalezas,
        "debilidades": debilidades,
    }


if __name__ == "__main__":
    import pprint

    pprint.pprint(calcular({i: 4 for i in range(1, 134)}))
