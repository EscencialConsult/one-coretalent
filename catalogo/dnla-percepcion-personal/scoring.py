"""
Motor de cálculo DETERMINISTA — DNLA Percepción Personal (Personal Insight Profile).

Port fiel de Test11/script.gs (calcularDimensiones / calcularPromedioGlobal /
identificarPerfilGlobal / generarBadgeGlobalHTML / obtenerInterpretacionGlobal /
generarAnalisisDetalladoHTML / generarPatronesTransversalesHTML / generarRiesgosHTML /
generarRecomendacionesHTML / generarResumenEjecutivoHTML / generarSintesisFinal).

Sin IA: mismo input -> mismo output. Lógica aprobada por psicólogo, no se altera; solo se porta.

Entrada:  24 respuestas en escala de frecuencia 1-5 (sin ítems inversos).
          dict {id 1-24: valor} o lista de 24 valores (posición 0 = ítem 1).
Salida:   promedios por dimensión, promedio global, perfil/badge/interpretación globales y
          todos los bloques textuales del informe seleccionados de forma determinista.

NOTA SOBRE ÍNDICES: el .gs opera sobre el array r[] base-0 (r[0]=ítem 1 ... r[23]=ítem 24).
Aquí 'r' es exactamente ese array (lista 0-23) para reproducir las condiciones idénticas.
"""

from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Mapping, Sequence

_DIR = Path(__file__).parent

with (_DIR / "preguntas.json").open(encoding="utf-8") as _f:
    _ITEMS = json.load(_f)["items"]
with (_DIR / "baremos.json").open(encoding="utf-8") as _f:
    _BAREMOS = json.load(_f)
with (_DIR / "interpretaciones.json").open(encoding="utf-8") as _f:
    _INTERP = json.load(_f)

DIMENSIONES = _BAREMOS["_orden_dimensiones"]
_NOMBRES = _BAREMOS["nombres_dimension"]
# Índices base-0 de los 4 ítems de cada dimensión, en orden de ítem.
_INDICES_POR_DIM = {
    d: [it["indice"] for it in _ITEMS if it["dimension"] == d] for d in DIMENSIONES
}


def _round_half_up(x: float) -> int:
    """Replica JS Math.round (half-up) para valores no negativos."""
    return math.floor(x + 0.5)


def _normalizar(respuestas: Mapping[int, int] | Sequence[int]) -> list[int]:
    """Devuelve el array r[] base-0 de 24 valores (igual al .gs)."""
    if isinstance(respuestas, Mapping):
        d = {int(k): int(v) for k, v in respuestas.items()}
        return [d.get(i + 1, 0) for i in range(24)]
    return [int(v) for v in respuestas]


# ── Evaluador de condiciones (data-driven, determinista) ──────────────────────
# Las condiciones en interpretaciones.json usan SOLO: r[<i>] <op> <num> [AND ...]
# y dim['<clave>'] <op> <num>. Operadores: >= <= < > ==. Sin OR, sin paréntesis.
_TERM = re.compile(
    r"^\s*(r\[(\d+)\]|dim\['([a-z_]+)'\])\s*(>=|<=|==|>|<)\s*([0-9.]+)\s*$"
)
_OPS = {
    ">=": lambda a, b: a >= b,
    "<=": lambda a, b: a <= b,
    ">": lambda a, b: a > b,
    "<": lambda a, b: a < b,
    "==": lambda a, b: a == b,
}


def _eval_cond(cond: str, r: list[int], dim: dict[str, float]) -> bool:
    for parte in cond.split("AND"):
        m = _TERM.match(parte)
        if not m:
            raise ValueError(f"Condición no soportada: {parte!r} (en {cond!r})")
        _, idx, dim_key, op, num = m.groups()
        izq = r[int(idx)] if idx is not None else dim[dim_key]
        der = float(num)
        if not _OPS[op](izq, der):
            return False
    return True


def _seleccionar_umbral(tabla: list[dict], promedio: float, campo: str = "min_promedio"):
    """Recorre umbrales descendentes; devuelve el primero con promedio >= umbral."""
    for u in tabla:
        if promedio >= u[campo]:
            return u
    return tabla[-1]


# ── Bloques textuales ─────────────────────────────────────────────────────────
def _analisis_dimension(clave: str, r: list[int], promedio: float) -> dict:
    cfg = _INTERP["analisis_dimensiones"][clave]
    elegido = None
    for rama in cfg["ramas"]:
        if _eval_cond(rama["condicion"], r, {}):
            elegido = rama
            break
    if elegido is None:
        elegido = cfg["default"]

    texto = elegido.get("texto")
    if texto is None and "dinamico" in elegido:
        texto = _texto_dinamico(elegido["dinamico"], r)
    fb = elegido["fb"]
    return {
        "dimension": clave,
        "nombre": _NOMBRES[clave],
        "promedio": round(promedio, 2),
        "promedio_texto": f"{promedio:.2f}",
        "texto": texto,
        "feedback": {
            "bien": fb["bien"],
            "op": fb["op"],
            "herr": fb["herr"],
            "kpi": fb["kpi"] or "Satisfacción personal",
        },
    }


def _texto_dinamico(nombre: str, r: list[int]) -> str:
    d = _INTERP["_dinamico"][nombre]
    if nombre == "relaciones_default":
        rama = d["alto"] if r[12] >= 4 else d["bajo"]
        return d["plantilla"].format(estilo=rama["estilo"], detalle=rama["detalle"])
    if nombre == "bienestar_default":
        rama = d["alto"] if r[16] >= 4 else d["bajo"]
        return d["plantilla"].format(nivel=rama["nivel"], detalle=rama["detalle"])
    raise ValueError(f"Texto dinámico desconocido: {nombre}")


def _patrones(r: list[int]) -> list[dict]:
    cfg = _INTERP["patrones_transversales"]
    out = []
    for t in cfg["tarjetas"]:
        if t.get("_grupo_if_elseif"):
            for rama in t["ramas"]:  # if / else if: gana la primera que aplique
                if _eval_cond(rama["condicion"], r, {}):
                    out.append({"titulo": rama["titulo"], "texto": rama["texto"]})
                    break
        elif _eval_cond(t["condicion"], r, {}):
            out.append({"titulo": t["titulo"], "texto": t["texto"]})
    if not out:
        sp = cfg["sin_patrones"]
        out.append({"titulo": sp["titulo"], "texto": sp["texto"]})
    return out


def _riesgos(r: list[int]) -> list[dict]:
    out = []
    for t in _INTERP["riesgos"]["tarjetas"]:
        if _eval_cond(t["condicion"], r, {}):
            out.append({"titulo": t["titulo"], "texto": t["texto"]})
    return out


def _recomendaciones(dim: dict[str, float]) -> list[dict]:
    cfg = _INTERP["recomendaciones"]
    recs = []
    for c in cfg["condicionales"]:
        if _eval_cond(c["condicion"], [], dim):
            recs.append({"icon": c["icon"], "titulo": c["titulo"], "texto": c["texto"]})
    if not recs:  # ninguna condicional aplicó
        for c in cfg["sin_deficits"]:
            recs.append({"icon": c["icon"], "titulo": c["titulo"], "texto": c["texto"]})
    for c in cfg["siempre"]:
        recs.append({"icon": c["icon"], "titulo": c["titulo"], "texto": c["texto"]})
    return recs


def _perfil_global(promedio: float, r: list[int]) -> dict:
    cfg = _BAREMOS["perfil_global"]
    for u in cfg["umbral_descendente"]:
        if promedio >= u["min_promedio"]:
            return {"titulo": u["titulo"], "descripcion": u["descripcion"]}
    # Ramas inferiores (promedio < 3.0)
    ramas = cfg["_ramas_inferiores"]
    if r[16] <= 2 and r[19] <= 2:
        rd = ramas["riesgo_desgaste"]
    else:
        rd = ramas["atencion_requerida"]
    return {"titulo": rd["titulo"], "descripcion": rd["descripcion"]}


def _resumen_ejecutivo(perfil: dict, dim: dict[str, float]) -> dict:
    cfg = _INTERP["resumen_ejecutivo"]
    fd = _BAREMOS["fortalezas_debilidades"]
    parrafos = [
        cfg["intro_plantilla"].format(
            perfil_titulo=perfil["titulo"], perfil_descripcion=perfil["descripcion"]
        )
    ]
    # Orden de iteración = orden de definición de dimensiones (DIMENSIONES).
    fortalezas = [_NOMBRES[d] for d in DIMENSIONES if dim[d] >= fd["umbral_fortaleza_min"]]
    if fortalezas:
        parrafos.append(
            cfg["pilares_plantilla"].format(
                lista=", ".join(fortalezas[: fd["max_fortalezas"]])
            )
        )
    debilidades = [_NOMBRES[d] for d in DIMENSIONES if dim[d] <= fd["umbral_debilidad_max"]]
    if debilidades:
        parrafos.append(
            cfg["atencion_plantilla"].format(
                lista=" y ".join(debilidades[: fd["max_debilidades"]])
            )
        )
    else:
        parrafos.append(cfg["sin_riesgo"])
    return {"parrafos": parrafos, "pilares": fortalezas, "areas_atencion": debilidades}


def calcular(respuestas: Mapping[int, int] | Sequence[int], nombre: str = "") -> dict:
    """Calcula el perfil DNLA Percepción Personal.

    respuestas: {id 1-24: valor 1-5} o lista de 24. nombre: para la síntesis final.
    """
    r = _normalizar(respuestas)

    # 1) Promedios por dimensión (suma de 4 ítems / 4) y promedio global.
    promedios = {d: sum(r[i] for i in _INDICES_POR_DIM[d]) / 4 for d in DIMENSIONES}
    promedio_global = sum(promedios.values()) / len(DIMENSIONES)

    # 2) Clasificación global por umbrales.
    badge = _seleccionar_umbral(_BAREMOS["badge_global"]["umbral_descendente"], promedio_global)
    perfil = _perfil_global(promedio_global, r)
    interp = _seleccionar_umbral(
        _BAREMOS["interpretacion_global"]["umbral_descendente"], promedio_global
    )

    # 3) Bloques textuales del informe.
    analisis = [_analisis_dimension(d, r, promedios[d]) for d in DIMENSIONES]
    resumen = _resumen_ejecutivo(perfil, promedios)

    sint = _INTERP["sintesis_final"]
    sintesis = (
        sint["mensaje_riesgo"] if "Riesgo" in perfil["titulo"] else sint["mensaje_general"]
    ).format(nombre=nombre)

    dimensiones = {
        d: {
            "nombre": _NOMBRES[d],
            "promedio": round(promedios[d], 2),
            "promedio_texto": f"{promedios[d]:.2f}",
        }
        for d in DIMENSIONES
    }

    return {
        "dimensiones": dimensiones,
        "promedio_global": round(promedio_global, 2),
        "promedio_global_texto": f"{promedio_global:.2f}",
        "perfil_global": perfil,
        "badge_global": {"clase": badge["clase"], "texto": badge["texto"]},
        "interpretacion_global": interp["texto"],
        "analisis_dimensiones": analisis,
        "patrones_transversales": _patrones(r),
        "riesgos": _riesgos(r),
        "recomendaciones": _recomendaciones(promedios),
        "resumen_ejecutivo": resumen,
        "sintesis_final": sintesis,
    }


if __name__ == "__main__":
    import pprint

    pprint.pprint(calcular({i: 3 for i in range(1, 25)}, nombre="Demo"))
