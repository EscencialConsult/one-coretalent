"""
Motor de cálculo DETERMINISTA — Test de Kuder (Registro de Preferencias Vocacionales, Forma C).

Port fiel de Test2/script.gs (parsearRespuestas / calcularResultados /
obtenerNivelInterpretacion). Sin IA: mismo input -> mismo output. Lógica aprobada,
no se altera.

Entrada:  respuestas del evaluado por tríada -> {mas: 0|1|2, menos: 0|1|2}.
          (mas/menos son índices de actividad dentro de la tríada).
Salida:   por área (0-9) -> puntaje directo (PD), percentil, nivel; áreas ordenadas,
          código de perfil (2 áreas más altas), áreas altas/bajas, verificación y
          estado de validez, profesiones combinadas.

NOTA SOBRE REDONDEO: el scoring del .gs NO usa Math.round en su ruta de cálculo
(el percentil es un lookup de tabla por rango). No hay, por tanto, ningún redondeo
que portar aquí. Se conserva math.floor(x + 0.5) por si el renderizador lo necesitara,
pero la lógica de puntuación no lo emplea.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Mapping, Sequence

_DIR = Path(__file__).parent

with (_DIR / "preguntas.json").open(encoding="utf-8") as _f:
    _P = json.load(_f)
    _TRIADAS = _P["triadas"]                    # 165 (autoridad del .gs)
    _KEYS = [t["keys"] for t in _TRIADAS]       # keys por tríada (índice actividad -> área)
    _N_SCORING = _P["n_triadas_scoring"]

with (_DIR / "baremos.json").open(encoding="utf-8") as _f:
    _B = json.load(_f)
    _BAREMOS = {int(k): v for k, v in _B["baremos"].items()}
    _PERCENTIL_DEFECTO = _B["percentil_por_defecto"]

with (_DIR / "interpretaciones.json").open(encoding="utf-8") as _f:
    _I = json.load(_f)
    _AREAS = {int(k): v for k, v in _I["areas"].items()}
    _NIVELES = _I["niveles"]["umbral_descendente"]
    _COMBINACIONES = _I["combinaciones_profesiones"]

N_AREAS = 10


def _round_half_up(x: float) -> int:
    """Replica JS Math.round (half-up) para valores no negativos. (No usado en scoring.)"""
    return math.floor(x + 0.5)


def _normalizar(respuestas) -> list[dict]:
    """
    Acepta:
      - lista de dicts {"mas": i, "menos": j} (posición 0 = tríada 1), o
      - dict {indice_triada: {"mas": i, "menos": j}} (indice base-0 o base-1 consistente con lista),
      - lista de strings "mas|menos" (formato de la planilla del .gs).
    Devuelve lista ordenada por tríada de dicts {"mas": int, "menos": int}.
    Réplica de parsearRespuestas: ignora pares no parseables.
    """
    if isinstance(respuestas, Mapping):
        # dict {idx: {...}} -> ordenar por clave numérica
        items = sorted(respuestas.items(), key=lambda kv: int(kv[0]))
        seq = [v for _, v in items]
    else:
        seq = list(respuestas)

    parsed = []
    for r in seq:
        if isinstance(r, str):
            # formato "mas|menos"
            parts = r.split("|")
            if len(parts) != 2:
                continue
            try:
                mas, menos = int(parts[0].strip()), int(parts[1].strip())
            except ValueError:
                continue
            parsed.append({"mas": mas, "menos": menos})
        elif isinstance(r, Mapping):
            try:
                mas, menos = int(r["mas"]), int(r["menos"])
            except (KeyError, TypeError, ValueError):
                continue
            parsed.append({"mas": mas, "menos": menos})
    return parsed


def _percentil(pd: int, area: int) -> int:
    """Lookup de baremo: primera fila con min <= PD <= max. Default 50 (igual que el .gs)."""
    for fila in _BAREMOS[area]:
        if fila["min"] <= pd <= fila["max"]:
            return fila["percentil"]
    return _PERCENTIL_DEFECTO


def _nivel(percentil: int) -> str:
    for u in _NIVELES:
        if percentil >= u["min_percentil"]:
            return u["nivel"]
    return _NIVELES[-1]["nivel"]


def calcular(respuestas) -> dict:
    """
    Calcula el perfil Kuder. Port fiel de calcularResultados (script.gs).

    respuestas: ver _normalizar. Se procesan solo las primeras len(TRIADAS)=165
    respuestas (guarda `idx < TRIADAS.length` del .gs).
    """
    r = _normalizar(respuestas)

    # --- Puntajes directos: +1 al área del 'mas' y +1 al área del 'menos' ---
    puntajes_directos = [0] * N_AREAS
    verificacion = 0
    for idx, resp in enumerate(r):
        if idx >= _N_SCORING:
            break  # réplica de: if (idx < TRIADAS.length)
        keys = _KEYS[idx]
        mas, menos = resp["mas"], resp["menos"]
        if 0 <= mas < 3:
            puntajes_directos[keys[mas]] += 1
        if 0 <= menos < 3:
            puntajes_directos[keys[menos]] += 1
        if mas != menos:
            verificacion += 1

    # --- Percentiles + nivel por área ---
    percentiles = []
    for i in range(N_AREAS):
        pd = puntajes_directos[i]
        p = _percentil(pd, i)
        percentiles.append({
            "area": i,
            "nombre": _AREAS[i]["nombre"],
            "descripcion": _AREAS[i]["descripcion"],
            "profesiones": _AREAS[i]["profesiones"],
            "puntajeDirecto": pd,
            "maxPD": _AREAS[i]["maxPD"],
            "percentil": p,
            "nivel": _nivel(p),
        })

    # --- Áreas ordenadas por percentil (desc). Orden estable como en JS Array.sort. ---
    areas_ordenadas = sorted(percentiles, key=lambda a: -a["percentil"])

    # --- Código de perfil: 2 áreas más altas, ordenadas ascendente por número de área ---
    top2 = areas_ordenadas[:2]
    codigo_perfil = "-".join(str(a) for a in sorted([top2[0]["area"], top2[1]["area"]]))

    areas_altas = [p for p in percentiles if p["percentil"] >= 75]
    areas_bajas = [p for p in percentiles if p["percentil"] <= 25]

    # --- Validez (manual, pág. 2): VALIDO 31-39, DUDOSO 28-32, INVALIDO <28 o >39 ---
    es_valido = 31 <= verificacion <= 39
    if verificacion < 28:
        estado_validez = "INVALIDO"
    elif verificacion <= 32:
        estado_validez = "DUDOSO"
    elif verificacion <= 39:
        estado_validez = "VALIDO"
    else:
        estado_validez = "INVALIDO"

    profesiones_combinadas = _COMBINACIONES.get(codigo_perfil, [])

    return {
        "puntajesDirectos": puntajes_directos,
        "percentiles": percentiles,
        "areasOrdenadas": areas_ordenadas,
        "areasAltas": areas_altas,
        "areasBajas": areas_bajas,
        "codigoPerfil": codigo_perfil,
        "top2": top2,
        "verificacion": verificacion,
        "esValido": es_valido,
        "estadoValidez": estado_validez,
        "profesionesCombinadas": profesiones_combinadas,
        "totalTriadas": len(r),
    }


if __name__ == "__main__":
    import pprint
    # Demo: en cada tríada, elegir mas=0 y menos=1.
    demo = [{"mas": 0, "menos": 1} for _ in range(_N_SCORING)]
    pprint.pprint(calcular(demo))
