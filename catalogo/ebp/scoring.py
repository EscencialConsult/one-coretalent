"""
Motor de cálculo DETERMINISTA — EBP (Escala de Bienestar Psicológico, Sánchez-Cánovas).

Port fiel de Test15/script.gs:
  parsearRespuestasEBP -> _parsear
  calcularResultadosEBP -> calcular
  obtenerPercentil      -> _obtener_percentil
  interpretarPercentil  -> _interpretar_percentil

Sin IA: mismo input -> mismo output. Lógica aprobada, no se altera; solo se porta.

Entrada (igual que el front, script.js sendResults):
    {
      "section1": {"1": v, ..., "40": v},   # solo ids 1..30 puntúan (BPS)
      "section2": {"1": v, ..., "10": v},   # BM
      "section3": {"1": v, ..., "25": v}    # ids 1..10 -> BL; ids 11..25 -> RP
    }
Salida: por subescala -> pd, percentil, interpretacion (nivel), texto; + pd_total.

NOTA: el .gs usa `respuestas[i] || 0` -> ítems faltantes cuentan como 0. Reproducido aquí.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Mapping

_DIR = Path(__file__).parent

with (_DIR / "baremos.json").open(encoding="utf-8") as _f:
    _B = json.load(_f)
    _TABLAS = _B["tablas"]
    _NIVELES = _B["niveles"]["umbral_descendente"]
with (_DIR / "interpretaciones.json").open(encoding="utf-8") as _f:
    _INTERP = json.load(_f)["por_subescala"]
with (_DIR / "preguntas.json").open(encoding="utf-8") as _f:
    _SUBESCALAS = json.load(_f)["subescalas"]

_INVERTIR_RP = [5, 6, 7, 10, 11, 12]  # script.gs: invertir_rp (índice RP 1..15)


def _to_int_keys(d: Mapping) -> dict[int, int]:
    """Convierte claves a int y valores a int. Acepta dict {str|int: num}."""
    out: dict[int, int] = {}
    for k, v in (d or {}).items():
        out[int(k)] = int(v)
    return out


def _parsear(respuestas: Mapping) -> dict:
    """Port de parsearRespuestasEBP: re-mapea section3 -> BL (1..10) y RP (1..15)."""
    if "section1" not in respuestas or "section2" not in respuestas or "section3" not in respuestas:
        raise ValueError("Faltan secciones en las respuestas (se requieren section1, section2, section3)")

    s1 = _to_int_keys(respuestas["section1"])
    s2 = _to_int_keys(respuestas["section2"])
    s3 = _to_int_keys(respuestas["section3"])

    bl: dict[int, int] = {}
    rp: dict[int, int] = {}
    for item_num, valor in s3.items():
        if 1 <= item_num <= 10:
            bl[item_num] = valor
        elif 11 <= item_num <= 25:
            rp[item_num - 10] = valor

    return {"seccion1_BPS": s1, "seccion2_BM": s2, "seccion3_BL": bl, "seccion3_RP": rp}


def _obtener_percentil(pd: int, tabla: list) -> int:
    """Port de obtenerPercentil: primer umbral con pd >= tabla[i].pd; si ninguno, 1."""
    for fila in tabla:
        if pd >= fila["pd"]:
            return fila["percentil"]
    return 1


def _interpretar_percentil(percentil: int) -> str:
    """Port de interpretarPercentil: nivel por umbral descendente del percentil."""
    for u in _NIVELES:
        if percentil >= u["min_percentil"]:
            return u["nivel"]
    return _NIVELES[-1]["nivel"]


def calcular(respuestas: Mapping) -> dict:
    """Calcula el perfil EBP. respuestas: {section1, section2, section3} (como el front)."""
    p = _parsear(respuestas)

    # BPS: suma ids 1..30 (sin inversión).
    pd_bps = sum(p["seccion1_BPS"].get(i, 0) for i in range(1, 31))

    # BM: suma ids 1..10 (sin inversión).
    pd_bm = sum(p["seccion2_BM"].get(i, 0) for i in range(1, 11))

    # BL: ids 1..10, invierte 5 y 8 (6 - valor).
    pd_bl = 0
    for i in range(1, 11):
        v = p["seccion3_BL"].get(i, 0)
        pd_bl += (6 - v) if i in (5, 8) else v

    # RP: ids 1..15, invierte [5,6,7,10,11,12] (6 - valor).
    pd_rp = 0
    for i in range(1, 16):
        v = p["seccion3_RP"].get(i, 0)
        pd_rp += (6 - v) if i in _INVERTIR_RP else v

    pd_total = pd_bps + pd_bm + pd_bl + pd_rp

    pds = {"BPS": pd_bps, "BM": pd_bm, "BL": pd_bl, "RP": pd_rp}
    subescalas = {}
    for clave, pd in pds.items():
        percentil = _obtener_percentil(pd, _TABLAS[clave])
        nivel = _interpretar_percentil(percentil)
        texto = _INTERP[clave][nivel]
        subescalas[clave] = {
            "nombre": _SUBESCALAS[clave]["nombre"],
            "pd": pd,
            "max_puntos": _SUBESCALAS[clave]["max_puntos"],
            "percentil": percentil,
            "interpretacion": nivel,
            "texto": texto["texto"],
            "color": texto["color"],
            "icono": texto["icono"],
        }

    return {"subescalas": subescalas, "pd_total": pd_total}


if __name__ == "__main__":
    import pprint

    demo = {
        "section1": {str(i): 3 for i in range(1, 41)},
        "section2": {str(i): 3 for i in range(1, 11)},
        "section3": {str(i): 3 for i in range(1, 26)},
    }
    pprint.pprint(calcular(demo))
