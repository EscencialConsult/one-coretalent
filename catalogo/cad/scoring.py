"""
Motor de cálculo DETERMINISTA — CAD (Cuestionario de Afrontamiento del Dolor).

Port fiel de Test14/script.js · calcularEscalasDetalladas() (autoridad del cálculo) y
Test14/script.gs · construirResumenEscalas() / rankearEscalas(). Sin IA: mismo input ->
mismo output. Lógica aprobada, no se altera.

IMPORTANTE: En el CAD el cálculo lo hace el FRONT (script.js); el .gs solo recibe el JSON de
escalas ya computado y construye el ranking (top 2 / bottom 2 por avg). Aquí se reproduce el
cálculo completo server-side.

Entrada:  respuestas del evaluado por ítem (id 1-31) en escala 0-4.
Salida:   por escala -> total, n, max, avg (0-4), pct (0-100); + ranking (top/bottom).

El CAD NO tiene baremos ni puntos de corte oficiales: la comparación es ipsativa (entre escalas
del mismo perfil), usando el promedio normalizado avg.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Mapping, Sequence

_DIR = Path(__file__).parent

with (_DIR / "preguntas.json").open(encoding="utf-8") as _f:
    _P = json.load(_f)
    _ESCALAS = _P["escalas"]
    _N_ITEMS = len(_P["items"])

with (_DIR / "interpretaciones.json").open(encoding="utf-8") as _f:
    _INTERP = json.load(_f)["por_escala"]

# Orden fijo de escalas (idéntico a CAD_INFO.escalas del .gs y a ESCALAS del .js).
ESCALAS_ORDEN = [
    "Religión",
    "Catarsis",
    "Distracción",
    "Autocontrol mental",
    "Autoafirmación",
    "Búsqueda de información",
]


def _round_half_up(x: float) -> int:
    """Replica JS Math.round / toFixed(0) (half-up) para valores no negativos."""
    return math.floor(x + 0.5)


def _to_fixed(x: float, decimals: int) -> float:
    """Replica JS Number(x.toFixed(d)) con redondeo half-up para valores no negativos."""
    factor = 10 ** decimals
    return _round_half_up(x * factor) / factor


def _normalizar(respuestas: Mapping[int, int] | Sequence[int]) -> dict[int, int]:
    """Acepta dict {id: valor} o lista de 31 valores (posición 0 = ítem 1)."""
    if isinstance(respuestas, Mapping):
        return {int(k): int(v) for k, v in respuestas.items()}
    return {i + 1: int(v) for i, v in enumerate(respuestas)}


def _calcular_escalas(r: Mapping[int, int]) -> dict:
    """Port fiel de calcularEscalasDetalladas() (script.js)."""
    resultado = {}
    for nombre in ESCALAS_ORDEN:
        items = _ESCALAS[nombre]["items"]
        n = len(items)
        max_ = n * 4
        total = sum(r[i] for i in items if i in r)  # ítems no respondidos = 0
        avg = _to_fixed(total / n, 2) if n > 0 else 0
        pct = _to_fixed((total / max_) * 100, 0) if max_ > 0 else 0
        resultado[nombre] = {
            "total": total,
            "n": n,
            "max": max_,
            "avg": avg,
            "pct": int(pct),
        }
    return resultado


def _rankear(escalas: dict) -> dict:
    """Port fiel de rankearEscalas() (script.gs): sort por avg desc, top 2 / bottom 2 (reverse)."""
    # Mantener orden estable original como en JS Array.prototype.sort (estable en V8 moderno).
    ordenado = sorted(ESCALAS_ORDEN, key=lambda k: escalas[k]["avg"], reverse=True)
    top = [{"key": k, "avg": escalas[k]["avg"]} for k in ordenado[:2]]
    bottom = [{"key": k, "avg": escalas[k]["avg"]} for k in list(reversed(ordenado[-2:]))]
    return {"top": top, "bottom": bottom}


def calcular(respuestas: Mapping[int, int] | Sequence[int]) -> dict:
    """Calcula el perfil CAD. respuestas: {id 1-31: valor 0-4} o lista de 31."""
    r = _normalizar(respuestas)

    escalas_calc = _calcular_escalas(r)
    escalas = {}
    for nombre in ESCALAS_ORDEN:
        meta = _INTERP.get(nombre, {})
        escalas[nombre] = {
            **escalas_calc[nombre],
            "foco": meta.get("foco", ""),
            "icono": meta.get("icono", ""),
            "color": meta.get("color", ""),
        }

    ranking = _rankear(escalas_calc)
    return {"escalas": escalas, "ranking": ranking}


if __name__ == "__main__":
    import pprint

    pprint.pprint(calcular({i: 2 for i in range(1, _N_ITEMS + 1)}))
