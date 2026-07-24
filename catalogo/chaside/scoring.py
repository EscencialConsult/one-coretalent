"""
Motor de cálculo DETERMINISTA — CHASIDE (Orientación Vocacional).

Port fiel de Test7/script.gs (parsearRespuestas / calcularResultados / calcularPercentil /
obtenerNivelInterpretacion). Sin IA: mismo input -> mismo output. Lógica aprobada, no se altera.

Entrada:  98 respuestas dicotómicas SI/NO (ítems 1-98).
Salida:   por área (C,H,A,S,I,D,E) -> puntaje directo (0-14), sub-puntajes de intereses y
          aptitudes, percentil, nivel e interpretación; + áreas ordenadas, top 2,
          código de perfil, áreas altas/bajas, profesiones combinadas y totales SI/NO.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Mapping, Sequence

_DIR = Path(__file__).parent

with (_DIR / "preguntas.json").open(encoding="utf-8") as _f:
    _PREG = json.load(_f)
    _ITEMS = _PREG["items"]
with (_DIR / "baremos.json").open(encoding="utf-8") as _f:
    _BAR = json.load(_f)
    _MAX_PD = _BAR["max_pd"]
    _TABLA_PCT = _BAR["percentil"]["tabla"]
    _NIVELES = _BAR["niveles"]["umbral_descendente"]
    _UMBRAL_ALTA = 9   # baremos.clasificacion_areas.area_alta: pd >= 9
    _UMBRAL_BAJA = 4   # baremos.clasificacion_areas.area_baja: pd <= 4
with (_DIR / "interpretaciones.json").open(encoding="utf-8") as _f:
    _INTERP = json.load(_f)
    _AREAS_DEF = _INTERP["areas"]
    _POR_NIVEL = _INTERP["por_nivel"]
    _COMBINACIONES = _INTERP["combinaciones"]

# Orden canónico de áreas (igual que el .gs: letras = ['C','H','A','S','I','D','E']).
AREAS = _PREG["areas"]

# Mapas pregunta -> área y sub-escala derivados de preguntas.json.
_AREA_DE = {it["id"]: it["area"] for it in _ITEMS}
_INTERES_IDS = {it["id"] for it in _ITEMS if it["subescala"] == "intereses"}
_APTITUD_IDS = {it["id"] for it in _ITEMS if it["subescala"] == "aptitudes"}
_MAX_INTERESES = {a: sum(1 for it in _ITEMS if it["area"] == a and it["subescala"] == "intereses") for a in AREAS}
_MAX_APTITUDES = {a: sum(1 for it in _ITEMS if it["area"] == a and it["subescala"] == "aptitudes") for a in AREAS}


def _normalizar(respuestas: Mapping[int, str] | Sequence[str]) -> dict[int, str]:
    """Acepta dict {id 1-98: 'SI'/'NO'} o lista/secuencia de 98 valores (posición 0 = ítem 1).

    Normaliza a mayúsculas y recorta espacios, igual que parsearRespuestas del .gs.
    """
    if isinstance(respuestas, Mapping):
        items = {int(k): str(v).strip().upper() for k, v in respuestas.items()}
    else:
        items = {i + 1: str(v).strip().upper() for i, v in enumerate(respuestas)}
    return items


def _calcular_percentil(pd: int) -> int:
    """Port fiel de calcularPercentil(pd, 14)."""
    if pd <= 0:
        return 5
    if pd >= _MAX_PD:
        return 99
    for rango in _TABLA_PCT:
        if rango["min"] <= pd <= rango["max"]:
            return rango["percentil"]
    return 50


def _obtener_nivel(pd: int) -> str:
    """Port fiel de obtenerNivelInterpretacion(pd)."""
    for u in _NIVELES:
        if pd >= u["min_pd"]:
            return u["nivel"]
    return _NIVELES[-1]["nivel"]


def calcular(respuestas: Mapping[int, str] | Sequence[str]) -> dict:
    """Calcula el perfil CHASIDE. respuestas: {id 1-98: 'SI'/'NO'} o lista de 98."""
    r = _normalizar(respuestas)

    puntajes = {a: 0 for a in AREAS}
    puntajes_intereses = {a: 0 for a in AREAS}
    puntajes_aptitudes = {a: 0 for a in AREAS}

    # Contar respuestas afirmativas por área (idéntico al forEach del .gs).
    for num_pregunta, resp in r.items():
        area = _AREA_DE.get(num_pregunta)
        if area and resp == "SI":
            puntajes[area] += 1
            if num_pregunta in _INTERES_IDS:
                puntajes_intereses[area] += 1
            if num_pregunta in _APTITUD_IDS:
                puntajes_aptitudes[area] += 1

    areas_resultado = []
    for letra in AREAS:
        pd = puntajes[letra]
        percentil = _calcular_percentil(pd)
        nivel = _obtener_nivel(pd)
        areas_resultado.append({
            "letra": letra,
            "nombre": _AREAS_DEF[letra]["nombre"],
            "descripcion": _AREAS_DEF[letra]["descripcion"],
            "aptitudes": _AREAS_DEF[letra]["aptitudes"],
            "profesiones": _AREAS_DEF[letra]["profesiones"],
            "puntajeDirecto": pd,
            "puntajeIntereses": puntajes_intereses[letra],
            "puntajeAptitudes": puntajes_aptitudes[letra],
            "maxPD": _MAX_PD,
            "maxIntereses": _MAX_INTERESES[letra],
            "maxAptitudes": _MAX_APTITUDES[letra],
            "percentil": percentil,
            "nivel": nivel,
            "interpretacion": _POR_NIVEL[nivel]["descripcion"],
        })

    # Ordenar por puntaje directo descendente.
    # JS Array.prototype.sort es estable; sorted() de Python también -> empates conservan
    # el orden canónico C,H,A,S,I,D,E (idéntico al .gs).
    areas_ordenadas = sorted(areas_resultado, key=lambda a: -a["puntajeDirecto"])

    top2 = areas_ordenadas[:2]
    codigo_letras = "-".join(sorted([top2[0]["letra"], top2[1]["letra"]]))

    areas_altas = [a for a in areas_resultado if a["puntajeDirecto"] >= _UMBRAL_ALTA]
    areas_bajas = [a for a in areas_resultado if a["puntajeDirecto"] <= _UMBRAL_BAJA]

    profesiones_combinadas = _COMBINACIONES.get(codigo_letras, [])

    total_si = sum(1 for v in r.values() if v == "SI")
    total_no = sum(1 for v in r.values() if v == "NO")

    return {
        "puntajes": puntajes,
        "areasResultado": areas_resultado,
        "areasOrdenadas": areas_ordenadas,
        "areasAltas": areas_altas,
        "areasBajas": areas_bajas,
        "codigoPerfil": codigo_letras,
        "top2": top2,
        "profesionesCombinadas": profesiones_combinadas,
        "totalPreguntas": len(r),
        "totalSI": total_si,
        "totalNO": total_no,
        "puntajesIntereses": puntajes_intereses,
        "puntajesAptitudes": puntajes_aptitudes,
    }


if __name__ == "__main__":
    import pprint

    # Ejemplo: todas SI -> 14 por área.
    pprint.pprint(calcular({i: "SI" for i in range(1, 99)})["codigoPerfil"])
