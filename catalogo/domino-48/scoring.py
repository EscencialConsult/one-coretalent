"""
Motor de cálculo DETERMINISTA — Dominó 48 (D-48).

Port fiel de Test5/script.gs (funciones calcularResultados / parsearRespuestas).
Sin IA: mismo input -> mismo output. La lógica fue aprobada por el psicólogo y no se altera.

Entrada:  respuestas del evaluado = ficha elegida por ítem, como par [pip_sup, pip_inf].
Salida:   correctas, porcentaje, percentil, nivel, tipología (A-G) e interpretación.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Iterable, Mapping, Sequence

_DIR = Path(__file__).parent


def _round_half_up(x: float) -> int:
    """Replica JS Math.round (redondeo half-up) para valores no negativos.

    Python round() usa redondeo bancario (round(62.5)==62); el .gs original usa
    Math.round (==63). Mantener idéntico el redondeo es parte de "cálculo idéntico
    a las matrices originales".
    """
    return math.floor(x + 0.5)

with (_DIR / "baremos.json").open(encoding="utf-8") as _f:
    _BAREMOS = json.load(_f)["rangos"]
with (_DIR / "tipologia.json").open(encoding="utf-8") as _f:
    _PATRONES = json.load(_f)["patrones"]
with (_DIR / "interpretaciones.json").open(encoding="utf-8") as _f:
    _INTERPRETACIONES = json.load(_f)["por_nivel"]
with (_DIR / "clave-respuestas.json").open(encoding="utf-8") as _f:
    _CLAVE = {int(k): tuple(v) for k, v in json.load(_f)["respuestas_correctas"].items()}

TOTAL_ITEMS = 48


def _es_correcta(item: int, ficha: Sequence[int] | None) -> bool:
    """Acierto = la ficha elegida coincide con la correcta en AMBOS pips.

    (Regla estándar del D-48 y la que aplica el front-end legacy; el .gs comparaba
    solo el primer pip por una limitación del formato de envío — ver ANALISIS.md.)
    """
    if ficha is None:
        return False
    correcta = _CLAVE.get(item)
    return correcta is not None and tuple(ficha) == correcta


def _baremo_para(correctas: int) -> dict:
    for rango in _BAREMOS:
        if rango["min"] <= correctas <= rango["max"]:
            return rango
    return _BAREMOS[-1]  # red de seguridad


def calcular(respuestas: Mapping[int, Sequence[int] | None]) -> dict:
    """Calcula el resultado del Dominó 48.

    `respuestas`: dict {nº_ítem (1-48): ficha_elegida [pip_sup, pip_inf] | None}.
    Las claves pueden venir como int o como str (p. ej. el JSON del front: {"1": [5, 6]}).
    Ítems ausentes o None se cuentan como no acertados (omitidos).
    """
    resp: dict[int, Sequence[int] | None] = {}
    for k, v in dict(respuestas).items():
        try:
            resp[int(k)] = v
        except (TypeError, ValueError):
            continue
    correccion = {i: _es_correcta(i, resp.get(i)) for i in range(1, TOTAL_ITEMS + 1)}
    correctas = sum(1 for ok in correccion.values() if ok)

    baremo = _baremo_para(correctas)

    analisis_por_tipo = {}
    for tipo, datos in _PATRONES.items():
        preguntas = datos["preguntas"]
        aciertos = sum(1 for p in preguntas if correccion.get(p))
        total = len(preguntas)
        analisis_por_tipo[tipo] = {
            "nombre": datos["nombre"],
            "correctas": aciertos,
            "total": total,
            "porcentaje": _round_half_up(aciertos / total * 100) if total else 0,
            "descripcion": datos["descripcion"],
        }

    return {
        "correctas": correctas,
        "total": TOTAL_ITEMS,
        "porcentaje": _round_half_up(correctas / TOTAL_ITEMS * 100),
        "percentil": baremo["percentil"],
        "nivel": baremo["nivel"],
        "descripcion": baremo["descripcion"],
        "analisis_por_tipo": analisis_por_tipo,
        "interpretacion": _INTERPRETACIONES[baremo["nivel"]],
    }


def calcular_desde_correccion(correccion: Mapping[int, bool] | Iterable[int]) -> dict:
    """Variante: recibe la corrección ya hecha (item->acierto bool, o lista de ítems acertados).

    Útil cuando la corrección la hace el cliente o para reproducir datos históricos.
    """
    if isinstance(correccion, Mapping):
        acertados = {int(i) for i, ok in correccion.items() if ok}
    else:
        acertados = {int(i) for i in correccion}
    # Reusa la lógica entregando la ficha correcta para los ítems acertados.
    respuestas = {i: list(_CLAVE[i]) for i in acertados if i in _CLAVE}
    return calcular(respuestas)


if __name__ == "__main__":
    # Demo rápida: un evaluado que acierta las primeras 30 fichas.
    demo = {i: list(_CLAVE[i]) for i in range(1, 31)}
    import pprint

    pprint.pprint(calcular(demo))
