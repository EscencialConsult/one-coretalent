"""
Motor de cálculo DETERMINISTA — IPP (Inventario de Intereses y Preferencias Profesionales).

Port fiel de Test3/script.gs (calcularResultadosIPP + NIVELES_INTERES + CAMPOS_PROFESIONALES).
Sin IA: mismo input -> mismo output. Lógica aprobada, no se altera; aquí solo se porta.

Entrada:  respuestas del evaluado por ítem (id 1-108) con valor 'A' | 'I' | 'D'.
Salida:   por campo -> puntuación (0-12), porcentaje, nivel, color, detalle A/I/D, descripción, carreras;
          + campos_predominantes (top 3), campos_rechazados (bottom 3), tipo_perfil, interpretacion_perfil.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Mapping

_DIR = Path(__file__).parent

with (_DIR / "baremos.json").open(encoding="utf-8") as _f:
    _B = json.load(_f)
    _VALORES = _B["valores_respuesta"]          # {"A": 2, "I": 1, "D": 0}
    _MAX_CAMPO = _B["puntuacion_maxima_campo"]  # 12
    _ORDEN_CAMPOS = _B["orden_campos"]          # orden de inserción del .gs
    _CAMPOS = _B["campos"]                       # {codigo: {nombre, items}}
    _NIVELES_ORDEN = _B["niveles_interes"]["orden"]
    _NIVELES = _B["niveles_interes"]["rangos"]

with (_DIR / "interpretaciones.json").open(encoding="utf-8") as _f:
    _I = json.load(_f)
    _INTERP_CAMPO = _I["por_campo"]
    _INTERP_PERFIL = _I["por_tipo_perfil"]


def _round_half_up(x: float) -> int:
    """Replica JS Math.round (half-up) para valores no negativos."""
    return math.floor(x + 0.5)


def _normalizar(respuestas: Mapping[int, str]) -> dict[int, str]:
    """Acepta dict {id: 'A'|'I'|'D'}. Normaliza claves a int y valores a mayúscula."""
    out = {}
    for k, v in respuestas.items():
        val = str(v).strip().upper()
        if val in _VALORES:
            out[int(k)] = val
    return out


def _clasificar_nivel(puntuacion: int) -> dict:
    """Primer rango (en orden MUY_ALTO..MUY_BAJO) que contenga la puntuación; por defecto MUY_BAJO."""
    for key in _NIVELES_ORDEN:
        n = _NIVELES[key]
        if n["min"] <= puntuacion <= n["max"]:
            return n
    return _NIVELES["MUY_BAJO"]


def calcular(respuestas: Mapping[int, str]) -> dict:
    """Calcula el perfil IPP. respuestas: {id 1-108: 'A'|'I'|'D'}."""
    r = _normalizar(respuestas)

    resultados_por_campo = {}
    for codigo in _ORDEN_CAMPOS:
        campo = _CAMPOS[codigo]
        puntuacion = 0
        agrada = indiferente = desagrada = 0
        for item in campo["items"]:
            resp = r.get(item)
            if resp == "A":
                puntuacion += 2
                agrada += 1
            elif resp == "I":
                puntuacion += 1
                indiferente += 1
            elif resp == "D":
                puntuacion += 0
                desagrada += 1

        porcentaje = _round_half_up(puntuacion / _MAX_CAMPO * 100)
        nivel = _clasificar_nivel(puntuacion)
        interp = _INTERP_CAMPO[codigo]

        resultados_por_campo[codigo] = {
            "nombre": campo["nombre"],
            "codigo": codigo,
            "puntuacion": puntuacion,
            "porcentaje": porcentaje,
            "nivel": nivel["nombre"],
            "color": nivel["color"],
            "descripcion": interp["descripcion"],
            "carreras": interp["carreras"],
            "detalle": {"agrada": agrada, "indiferente": indiferente, "desagrada": desagrada},
        }

    # Ordenar por puntuación desc. JS Array.sort es estable: en empate se conserva
    # el orden de inserción (= _ORDEN_CAMPOS). Reproducido con sort estable por -puntuacion.
    campos_ordenados = sorted(
        (resultados_por_campo[c] for c in _ORDEN_CAMPOS),
        key=lambda c: -c["puntuacion"],
    )

    campos_predominantes = campos_ordenados[:3]
    # .slice(-3).reverse() — los 3 últimos, invertidos.
    campos_rechazados = list(reversed(campos_ordenados[-3:]))

    puntuacion_max = campos_ordenados[0]["puntuacion"]
    puntuacion_min = campos_ordenados[-1]["puntuacion"]
    rango = puntuacion_max - puntuacion_min

    tipo_perfil = "definido"
    interpretacion_perfil = _INTERP_PERFIL["definido"]
    if rango <= 4:
        tipo_perfil = "plano"
        interpretacion_perfil = _INTERP_PERFIL["plano"]
    elif len([c for c in campos_predominantes if c["puntuacion"] >= 8]) >= 5:
        # Nota: campos_predominantes son solo 3 elementos, por lo que esta rama
        # NUNCA se cumple (port fiel del .gs; ver ANALISIS.md).
        tipo_perfil = "disperso"
        interpretacion_perfil = _INTERP_PERFIL["disperso"]

    return {
        "campos": resultados_por_campo,
        "campos_ordenados": campos_ordenados,
        "campos_predominantes": campos_predominantes,
        "campos_rechazados": campos_rechazados,
        "rango": rango,
        "tipo_perfil": tipo_perfil,
        "interpretacion_perfil": interpretacion_perfil,
    }


if __name__ == "__main__":
    import pprint

    pprint.pprint(calcular({i: "I" for i in range(1, 109)}))
