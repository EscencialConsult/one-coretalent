"""
Motor de cálculo DETERMINISTA — DNLA Perfil Comercial (DNLA Sales Profile).

Port fiel de Test10/script.gs (parsearRespuestas / calcularPromedioDimension /
clasificarNivel / analizarResultados / identificarFortalezas / identificarAreasMejora /
generarRecomendacionesGlobales). Sin IA: mismo input -> mismo output.
Lógica aprobada por el psicólogo, no se altera: solo se porta.

Entrada:  respuestas del evaluado por ítem (id 1-25) en escala 1-5.
Salida:   por dimensión -> promedio (1.0-5.0), nivel, badge, emoji, color e interpretación;
          + promedio global, fortalezas (top 3), áreas de mejora (bottom 3) y
          recomendaciones globales.

Notas de fidelidad al .gs:
- El nivel se clasifica con el PROMEDIO crudo (float), no con el promedio redondeado a 2
  decimales. El campo 'promedio' expuesto es la cadena toFixed(2) (igual que el .gs).
- calcularPromedioDimension usa (respuestas[pregunta] || 0): un ítem ausente o 0 cuenta
  como 0 en la suma; el divisor es SIEMPRE 5 (count de preguntas de la dimensión).
- El orden de fortalezas/áreas replica Array.prototype.sort sobre parseFloat(toFixed(2)),
  que es estable en V8 para arrays de este tamaño (se preserva el orden de inserción de
  empates: el de DIMENSIONES 1..5).
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Mapping, Sequence

_DIR = Path(__file__).parent

with (_DIR / "preguntas.json").open(encoding="utf-8") as _f:
    _ITEMS = json.load(_f)["items"]
with (_DIR / "baremos.json").open(encoding="utf-8") as _f:
    _B = json.load(_f)
    _NIVELES = _B["niveles"]["umbral_descendente"]
    _DIMS = _B["dimensiones"]
with (_DIR / "interpretaciones.json").open(encoding="utf-8") as _f:
    _I = json.load(_f)
    _INTERP = _I["por_dimension"]
    _GLOBALES = _I["globales"]

# Orden canónico de dimensiones (igual que DIMENSIONES 1..5 del .gs).
DIMENSIONES = sorted(_DIMS, key=lambda d: _DIMS[d]["numero"])


def _round_half_up(x: float) -> int:
    """Replica JS Math.round (half-up) para valores no negativos."""
    return math.floor(x + 0.5)


def _to_fixed_2(x: float) -> str:
    """Replica Number.prototype.toFixed(2) (half-up) para valores no negativos."""
    return f"{_round_half_up(x * 100) / 100:.2f}"


def _js_parse_int(s: str):
    """Replica JS parseInt(x.trim(), 10): salta espacios, signo opcional y dígitos
    iniciales; devuelve None si no hay número (NaN en JS)."""
    s = s.strip()
    i = 0
    if i < len(s) and s[i] in "+-":
        i += 1
    j = i
    while j < len(s) and s[j].isdigit():
        j += 1
    if j == i:
        return None  # NaN
    sign = -1 if s[:1] == "-" else 1
    return sign * int(s[i:j])


def parsear_respuestas(texto: str) -> dict[int, int]:
    """Port FIEL de parsearRespuestas (script.gs):
    'AmA1:5,2:4,...' -> {1:5, 2:4, ...} usando split(',') -> split(':') -> parseInt.

    Igual que el .gs, NO sanea el wrapper de tiempo del front ('{Xm Ys - 1:5,...}'):
    en ese caso el primer par produce una clave NaN (descartada). Ver ANALISIS.md
    (discrepancia front vs back en el formato enviado)."""
    respuestas: dict[int, int] = {}
    for par in texto.split(","):
        if ":" not in par:
            izq, der = par, ""
        else:
            izq, der = par.split(":", 1)
        pregunta = _js_parse_int(izq)
        valor = _js_parse_int(der)
        if pregunta is None:
            continue  # clave NaN -> en el .gs sería respuestas[NaN], aquí se descarta
        respuestas[pregunta] = valor if valor is not None else 0
    return respuestas


def _normalizar(respuestas: Mapping[int, int] | Sequence[int] | str) -> dict[int, int]:
    """Acepta dict {id:valor}, lista de 25 valores (pos 0 = ítem 1) o str '1:5,2:4,...'."""
    if isinstance(respuestas, str):
        return parsear_respuestas(respuestas)
    if isinstance(respuestas, Mapping):
        return {int(k): int(v) for k, v in respuestas.items()}
    return {i + 1: int(v) for i, v in enumerate(respuestas)}


def _promedio_dimension(respuestas: dict[int, int], dim_key: str) -> float:
    """Port de calcularPromedioDimension: suma de los 5 ítems / 5 (ausente=0)."""
    preguntas = _DIMS[dim_key]["preguntas"]
    suma = 0
    count = 0
    for p in preguntas:
        suma += respuestas.get(p, 0) or 0
        count += 1
    return suma / count if count > 0 else 0.0


def _clasificar_nivel(promedio: float) -> dict:
    """Port de clasificarNivel: primer nivel cuyo min <= promedio (descendente)."""
    for u in _NIVELES:
        if promedio >= u["min"]:
            return u
    return _NIVELES[-1]


def calcular(respuestas: Mapping[int, int] | Sequence[int] | str) -> dict:
    """Calcula el perfil comercial DNLA. respuestas: {id 1-25:valor 1-5}, lista de 25 o str."""
    r = _normalizar(respuestas)

    dimensiones = {}
    suma_promedios = 0.0
    for dim_key in DIMENSIONES:
        prom = _promedio_dimension(r, dim_key)
        nivel = _clasificar_nivel(prom)
        meta = _DIMS[dim_key]
        interp = _INTERP[dim_key][nivel["nivel"]]
        dimensiones[dim_key] = {
            "numero": meta["numero"],
            "nombre": meta["nombre"],
            "descripcion": meta["descripcion"],
            "promedio": _to_fixed_2(prom),
            "_promedio_num": prom,
            "nivel": nivel["nivel"],
            "badge": nivel["badge"],
            "emoji": nivel["emoji"],
            "color": nivel["color"],
            "interpretacion": interp,
        }
        suma_promedios += prom

    promedio_global = suma_promedios / 5
    nivel_global = _clasificar_nivel(promedio_global)

    # Fortalezas / áreas: ordenar por parseFloat(toFixed(2)), estable (orden 1..5 en empates).
    orden = list(dimensiones.keys())  # ya está en orden numero 1..5
    fortalezas = sorted(
        orden, key=lambda d: -float(dimensiones[d]["promedio"])
    )[:3]
    areas = sorted(
        orden, key=lambda d: float(dimensiones[d]["promedio"])
    )[:3]

    def _resumen(keys):
        return [
            {"clave": k, "nombre": dimensiones[k]["nombre"], "promedio": float(dimensiones[k]["promedio"])}
            for k in keys
        ]

    return {
        "dimensiones": dimensiones,
        "promedio_global": _to_fixed_2(promedio_global),
        "nivel_global": nivel_global["nivel"],
        "badge_global": nivel_global["badge"],
        "emoji_global": nivel_global["emoji"],
        "color_global": nivel_global["color"],
        "fortalezas": _resumen(fortalezas),
        "areas_mejora": _resumen(areas),
        "recomendaciones_globales": _GLOBALES[nivel_global["nivel"]],
    }


if __name__ == "__main__":
    import pprint

    pprint.pprint(calcular({i: 3 for i in range(1, 26)}))
