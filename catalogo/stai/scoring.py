"""
Motor de cálculo DETERMINISTA — STAI (Cuestionario de Ansiedad Estado-Rasgo).

Port fiel de Test16 (index.html · calcularPuntuaciones + script.gs · calcularResultadosSTAI /
obtenerCategoria / obtenerPercentil / calcularFactoriales). Sin IA: mismo input -> mismo output.
Lógica aprobada por psicólogo, no se altera; solo se porta.

Modelo de datos (cadena de procesamiento original HTML -> .gs):
  1. El evaluado selecciona en cada ítem una opción 0..3 (índice de la opción).
     Estado: 0=Nada 1=Algo 2=Bastante 3=Mucho.
     Rasgo:  0=Casi nunca 1=A veces 2=A menudo 3=Casi siempre.
  2. El HTML, antes de guardar, invierte los ítems 'inverso': guarda (3 - valor).
     Así todos los valores guardados quedan en DIRECCIÓN-ANSIEDAD (0..3).
  3. El .gs suma esos valores ya invertidos:
        PD Estado = suma ítems 1-20   (rango 0-60)
        PD Rasgo  = suma ítems 21-40  (rango 0-60)

Esta implementación acepta por defecto los valores CRUDOS del usuario (0..3, como en el
HTML) y aplica la inversión internamente, reproduciendo toda la cadena. Con
`ya_invertidas=True` acepta directamente los valores en dirección-ansiedad (formato hoja .gs).

Entrada:  respuestas {id 1-40: valor 0-3} o lista de 40 valores (posición 0 = ítem 1), y sexo.
Salida:   PD por escala, categoría y percentil (según sexo), 4 factores, relación E/R e interpretaciones.
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
    _CATEGORIAS = _B["categorias"]
    _PERCENTILES = _B["percentiles"]
    _FACTORES = _B["factores"]
    _UMBRAL_ER = _B["relacion_estado_rasgo"]["umbral"]
with (_DIR / "interpretaciones.json").open(encoding="utf-8") as _f:
    _INTERP = json.load(_f)

_ITEM_POR_ID = {it["id"]: it for it in _ITEMS}
_INVERSOS = {it["id"] for it in _ITEMS if it["inverso"]}
_IDS_ESTADO = [it["id"] for it in _ITEMS if it["tipo"] == "estado"]
_IDS_RASGO = [it["id"] for it in _ITEMS if it["tipo"] == "rasgo"]

_OPCIONES_ESTADO = ["Nada", "Algo", "Bastante", "Mucho"]
_OPCIONES_RASGO = ["Casi nunca", "A veces", "A menudo", "Casi siempre"]


def _round_half_up(x: float) -> int:
    """Replica JS Math.round (half-up) para valores no negativos."""
    return math.floor(x + 0.5)


def _normalizar(respuestas: Mapping[int, int] | Sequence[int]) -> dict[int, int]:
    """Acepta dict {id: valor} o lista de 40 valores (posición 0 = ítem 1)."""
    if isinstance(respuestas, Mapping):
        return {int(k): int(v) for k, v in respuestas.items()}
    return {i + 1: int(v) for i, v in enumerate(respuestas)}


def _a_direccion_ansiedad(
    respuestas: Mapping[int, int] | Sequence[int], ya_invertidas: bool
) -> dict[int, int]:
    """Devuelve {id: valor en dirección-ansiedad 0..3}, aplicando la inversión del HTML."""
    r = _normalizar(respuestas)
    if ya_invertidas:
        return r
    return {i: (3 - v if i in _INVERSOS else v) for i, v in r.items()}


def _categoria(pd: int, tabla: list[dict]) -> str:
    for rango in tabla:
        if rango["min"] <= pd <= rango["max"]:
            return rango["categoria"]
    return "Alto"


def _percentil(pd: int, tabla: list[dict]) -> int:
    for fila in tabla:
        if pd >= fila["pd"]:
            return fila["centil"]
    return 1


def _factoriales(direccion: dict[int, int]) -> dict:
    """EA/RA suman el valor dirección-ansiedad; EN/RN suman el valor original (3 - direccion)."""
    resultado = {}
    for clave, factor in _FACTORES.items():
        if clave.startswith("_"):
            continue
        suma = 0
        total = len(factor["items"])
        max_posible = total * 3
        for item_id in factor["items"]:
            if item_id in direccion:
                if clave in ("EN", "RN"):
                    suma += 3 - direccion[item_id]
                else:
                    suma += direccion[item_id]
        porcentaje = _round_half_up(suma / max_posible * 100) if max_posible > 0 else 0
        resultado[clave] = {
            "nombre": factor["nombre"],
            "descripcion": factor["descripcion"],
            "suma": suma,
            "max_posible": max_posible,
            "porcentaje": porcentaje,
            "num_items": total,
        }
    return resultado


def _analisis_items(direccion: dict[int, int]) -> list[dict]:
    items = []
    for id_ in range(1, 41):
        if id_ not in direccion:
            continue
        item = _ITEM_POR_ID[id_]
        valor_ansiedad = direccion[id_]
        valor_original = 3 - valor_ansiedad if item["inverso"] else valor_ansiedad
        opciones = _OPCIONES_ESTADO if item["tipo"] == "estado" else _OPCIONES_RASGO
        respuesta_texto = opciones[valor_original] if 0 <= valor_original < len(opciones) else "N/A"
        items.append(
            {
                "id": id_,
                "texto": item["text"],
                "tipo": item["tipo"],
                "inverso": item["inverso"],
                "valor_original": valor_original,
                "valor_ansiedad": valor_ansiedad,
                "respuesta_texto": respuesta_texto,
            }
        )
    return items


def _pd_con_prorrateo(direccion: dict[int, int], ids: list[int]) -> tuple[int, int]:
    """Suma los ítems de la escala. Prorratea si se respondieron 18 o 19 (de 20)."""
    suma = 0
    respondidos = 0
    for i in ids:
        if i in direccion:
            suma += direccion[i]
            respondidos += 1
    if 18 <= respondidos < 20:
        suma = _round_half_up(suma / respondidos * 20)
    return suma, respondidos


def calcular(
    respuestas: Mapping[int, int] | Sequence[int],
    sexo: str = "ambos",
    ya_invertidas: bool = False,
) -> dict:
    """Calcula el perfil STAI.

    respuestas:    {id 1-40: valor 0-3} o lista de 40. Valores crudos del usuario (0-3).
    sexo:          'varon', 'mujer' o 'ambos' (incluye ambos baremos).
    ya_invertidas: True si las respuestas ya vienen en dirección-ansiedad (formato hoja .gs).
    """
    direccion = _a_direccion_ansiedad(respuestas, ya_invertidas)

    pd_estado, n_estado = _pd_con_prorrateo(direccion, _IDS_ESTADO)
    pd_rasgo, n_rasgo = _pd_con_prorrateo(direccion, _IDS_RASGO)

    cat_varon_ae = _categoria(pd_estado, _CATEGORIAS["VARONES_AE"])
    cat_mujer_ae = _categoria(pd_estado, _CATEGORIAS["MUJERES_AE"])
    cat_varon_ar = _categoria(pd_rasgo, _CATEGORIAS["VARONES_AR"])
    cat_mujer_ar = _categoria(pd_rasgo, _CATEGORIAS["MUJERES_AR"])

    pct_varon_ae = _percentil(pd_estado, _PERCENTILES["VARONES_AE"])
    pct_mujer_ae = _percentil(pd_estado, _PERCENTILES["MUJERES_AE"])
    pct_varon_ar = _percentil(pd_rasgo, _PERCENTILES["VARONES_AR"])
    pct_mujer_ar = _percentil(pd_rasgo, _PERCENTILES["MUJERES_AR"])

    factoriales = _factoriales(direccion)
    analisis_items = _analisis_items(direccion)

    if pd_estado > pd_rasgo + _UMBRAL_ER:
        relacion = "estado_mayor"
    elif pd_estado < pd_rasgo - _UMBRAL_ER:
        relacion = "estado_menor"
    else:
        relacion = "estado_igual"

    escalas = {
        "estado": {
            "nombre": "Ansiedad Estado (A/E)",
            "pd": pd_estado,
            "items_respondidos": n_estado,
            "categoria_varon": cat_varon_ae,
            "categoria_mujer": cat_mujer_ae,
            "percentil_varon": pct_varon_ae,
            "percentil_mujer": pct_mujer_ae,
            "interpretacion_varon": _INTERP["por_categoria"][cat_varon_ae]["estado"],
            "interpretacion_mujer": _INTERP["por_categoria"][cat_mujer_ae]["estado"],
        },
        "rasgo": {
            "nombre": "Ansiedad Rasgo (A/R)",
            "pd": pd_rasgo,
            "items_respondidos": n_rasgo,
            "categoria_varon": cat_varon_ar,
            "categoria_mujer": cat_mujer_ar,
            "percentil_varon": pct_varon_ar,
            "percentil_mujer": pct_mujer_ar,
            "interpretacion_varon": _INTERP["por_categoria"][cat_varon_ar]["rasgo"],
            "interpretacion_mujer": _INTERP["por_categoria"][cat_mujer_ar]["rasgo"],
        },
    }

    # Vista por sexo (si se solicita varon/mujer): categoría/percentil/interpretación únicos.
    if sexo in ("varon", "mujer"):
        suf = "varon" if sexo == "varon" else "mujer"
        for esc in escalas.values():
            esc["categoria"] = esc[f"categoria_{suf}"]
            esc["percentil"] = esc[f"percentil_{suf}"]
            esc["interpretacion"] = esc[f"interpretacion_{suf}"]

    return {
        "sexo": sexo,
        "escalas": escalas,
        "pd_estado": pd_estado,
        "pd_rasgo": pd_rasgo,
        "factores": factoriales,
        "relacion_estado_rasgo": relacion,
        "texto_relacion": _INTERP["relacion_estado_rasgo"][relacion],
        "analisis_items": analisis_items,
    }


if __name__ == "__main__":
    import pprint

    pprint.pprint(calcular({i: 2 for i in range(1, 41)}, sexo="varon"))
