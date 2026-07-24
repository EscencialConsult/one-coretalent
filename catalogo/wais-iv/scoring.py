"""
Motor de cálculo DETERMINISTA — WAIS-IV (adaptación screening de opción múltiple).

Port fiel de Test4/script.gs (parsearRespuestasWAIS / calcularResultadosWAIS). Sin IA:
mismo input -> mismo output. Lógica aprobada, no se altera.

Entrada:  respuestas del evaluado por parte (parte1, parte2), cada una {id 1-50: letra "a".."d"}.
          También acepta el string crudo "{PI: 0m 55s - 1;a, ...} {PII: 1m 11s - 1;c, ...}".
Salida:   por índice (ICV/IRP/IMT/IVP) -> correctas/total/porcentaje/pe/rango/color/interpretacion;
          + ciTotal, nivelCI, totales, fortaleza, debilidad, tiempos.

Notas de fidelidad:
- Math.round (JS, half-up) se replica con math.floor(x + 0.5) sobre valores no negativos.
- Acierto requiere que la respuesta exista Y coincida con la clave (omisión = fallo).
- fortaleza = índice de mayor %, debilidad = de menor %; empates resueltos por orden
  estable de inserción ICV, IRP, IMT, IVP (igual que Array.prototype.sort en V8).
"""

from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Mapping

_DIR = Path(__file__).parent

with (_DIR / "preguntas.json").open(encoding="utf-8") as _f:
    _P = json.load(_f)
    _CLAVES_PART1 = {it["id"]: it["correct"] for it in _P["parte1"]}
    _CLAVES_PART2 = {it["id"]: it["correct"] for it in _P["parte2"]}
with (_DIR / "baremos.json").open(encoding="utf-8") as _f:
    _B = json.load(_f)
    _BAREMOS_INDICE = _B["indice"]["tramos"]
    _BAREMOS_CI = _B["ci"]["tramos"]
    _UMBRAL_ALTO = _B["interpretacion_umbral"]["alto"]
    _UMBRAL_MEDIO = _B["interpretacion_umbral"]["medio"]
with (_DIR / "interpretaciones.json").open(encoding="utf-8") as _f:
    _I = json.load(_f)
    _NOMBRES = _I["nombres_indices"]
    _INTERP = _I["por_indice"]

# Distribución de ítems por índice (Test4/script.gs · INDICES_PART1 / INDICES_PART2).
_ITEMS_ICV = list(range(1, 26))    # Parte 1, ítems 1-25
_ITEMS_IRP = list(range(26, 51))   # Parte 1, ítems 26-50
_ITEMS_IMT = list(range(1, 26))    # Parte 2, ítems 1-25
_ITEMS_IVP = list(range(26, 51))   # Parte 2, ítems 26-50

# Orden de inserción de índices (clave para desempates de fortaleza/debilidad).
_ORDEN_INDICES = ["ICV", "IRP", "IMT", "IVP"]


def _round_half_up(x: float) -> int:
    """Replica JS Math.round (half-up) para valores no negativos."""
    return math.floor(x + 0.5)


def parsear_respuestas(texto: str) -> dict:
    """Port de parsearRespuestasWAIS: extrae tiempos y respuestas del string crudo.

    Formato: "{PI: 0m 55s - 1;a, 2;c, ...} {PII: 1m 11s - 1;c, 2;c, ...}"
    Devuelve {tiempoParte1, tiempoParte2, parte1: {id: letra}, parte2: {id: letra}}.
    """
    resultado = {"tiempoParte1": "", "tiempoParte2": "", "parte1": {}, "parte2": {}}

    m1 = re.search(r"\{PI:\s*(\d+m\s*\d+s)\s*-\s*([^}]+)\}", texto)
    if m1:
        resultado["tiempoParte1"] = m1.group(1)
        for r in m1.group(2).split(","):
            partes = r.strip().split(";")
            if len(partes) >= 2 and partes[0] and partes[1]:
                resultado["parte1"][int(partes[0])] = partes[1].lower().strip()

    m2 = re.search(r"\{PII:\s*(\d+m\s*\d+s)\s*-\s*([^}]+)\}", texto)
    if m2:
        resultado["tiempoParte2"] = m2.group(1)
        for r in m2.group(2).split(","):
            partes = r.strip().split(";")
            if len(partes) >= 2 and partes[0] and partes[1]:
                resultado["parte2"][int(partes[0])] = partes[1].lower().strip()

    return resultado


def _normalizar(respuestas) -> dict:
    """Acepta el string crudo o un dict {parte1:{...}, parte2:{...}, tiempoParte1, tiempoParte2}."""
    if isinstance(respuestas, str):
        return parsear_respuestas(respuestas)
    parte1 = {int(k): str(v).lower().strip() for k, v in respuestas.get("parte1", {}).items()}
    parte2 = {int(k): str(v).lower().strip() for k, v in respuestas.get("parte2", {}).items()}
    return {
        "tiempoParte1": respuestas.get("tiempoParte1", ""),
        "tiempoParte2": respuestas.get("tiempoParte2", ""),
        "parte1": parte1,
        "parte2": parte2,
    }


def _aciertos(respuestas_parte: Mapping[int, str], claves: Mapping[int, str], items: list[int]) -> int:
    n = 0
    for item in items:
        resp = respuestas_parte.get(item)
        if resp and resp == claves[item]:
            n += 1
    return n


def _baremo_indice(porcentaje: int) -> dict:
    for b in _BAREMOS_INDICE:
        if b["min"] <= porcentaje <= b["max"]:
            return b
    return _BAREMOS_INDICE[-1]


def _interpretacion(idx: str, porcentaje: int) -> str:
    interp = _INTERP[idx]
    if porcentaje >= _UMBRAL_ALTO:
        return interp["alto"]
    if porcentaje >= _UMBRAL_MEDIO:
        return interp["medio"]
    return interp["bajo"]


def _nivel_ci(ci_total: int) -> dict:
    nivel = _BAREMOS_CI[-1]
    for b in _BAREMOS_CI:
        if b["min"] <= ci_total <= b["max"]:
            nivel = b
            break
    return nivel


def calcular(respuestas) -> dict:
    """Calcula el perfil WAIS-IV. `respuestas`: string crudo o dict con parte1/parte2."""
    r = _normalizar(respuestas)

    correctas = {
        "ICV": _aciertos(r["parte1"], _CLAVES_PART1, _ITEMS_ICV),
        "IRP": _aciertos(r["parte1"], _CLAVES_PART1, _ITEMS_IRP),
        "IMT": _aciertos(r["parte2"], _CLAVES_PART2, _ITEMS_IMT),
        "IVP": _aciertos(r["parte2"], _CLAVES_PART2, _ITEMS_IVP),
    }

    indices = {}
    for idx in _ORDEN_INDICES:
        total = 25
        porcentaje = _round_half_up(correctas[idx] / total * 100)
        b = _baremo_indice(porcentaje)
        indices[idx] = {
            "nombre": _NOMBRES[idx],
            "correctas": correctas[idx],
            "total": total,
            "porcentaje": porcentaje,
            "pe": b["pe"],
            "rango": b["rango"],
            "color": b["color"],
            "interpretacion": _interpretacion(idx, porcentaje),
        }

    # CI Total estimado: round(40 + sumaPE*1.5).
    suma_pe = sum(indices[idx]["pe"] for idx in _ORDEN_INDICES)
    ci_total = _round_half_up(40 + suma_pe * 1.5)
    nivel_ci = _nivel_ci(ci_total)

    total_correctas = sum(correctas[idx] for idx in _ORDEN_INDICES)
    total_preguntas = 100
    porcentaje_total = _round_half_up(total_correctas / total_preguntas * 100)

    # Fortaleza/debilidad: orden estable descendente por porcentaje (empates -> orden de inserción).
    ordenados = sorted(_ORDEN_INDICES, key=lambda idx: -indices[idx]["porcentaje"])
    fortaleza = {"codigo": ordenados[0], "nombre": _NOMBRES[ordenados[0]]}
    debilidad = {"codigo": ordenados[3], "nombre": _NOMBRES[ordenados[3]]}

    return {
        "indices": indices,
        "ciTotal": ci_total,
        "nivelCI": {"nivel": nivel_ci["nivel"], "descripcion": nivel_ci["descripcion"]},
        "totalCorrectas": total_correctas,
        "totalPreguntas": total_preguntas,
        "porcentajeTotal": porcentaje_total,
        "tiempoParte1": r["tiempoParte1"],
        "tiempoParte2": r["tiempoParte2"],
        "fortaleza": fortaleza,
        "debilidad": debilidad,
    }


if __name__ == "__main__":
    import pprint

    pprint.pprint(calcular({"parte1": {}, "parte2": {}}))
