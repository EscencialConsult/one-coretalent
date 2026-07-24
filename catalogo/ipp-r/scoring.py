"""
Motor de cálculo DETERMINISTA — IPP-R (Intereses y Preferencias Profesionales, Revisado).

Port fiel de Test8/script.gs (calcularPuntuacionesIPPR / analizarPerfil / evaluarValidez).
Sin IA: mismo input -> mismo output. Lógica aprobada, no se altera.

Entrada:  respuestas del evaluado por ítem (id 1-180) en escala 0-3
          (0=No Conozco, 1=Desagrado, 2=Indiferencia, 3=Agrado).
Salida:   por campo -> PD total/AC/PR, %, nº NC, nivel; ranking; tipo de perfil;
          primarios/secundarios/rechazos/desconocidos; discrepancias AC/PR; + validez.
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
    _NIVELES = _B["niveles_interes"]
    _PD_MAX = _B["pd_max_por_campo"]
    _P = _B["_perfil"]
with (_DIR / "interpretaciones.json").open(encoding="utf-8") as _f:
    _I = json.load(_f)
    _CAMPOS_META = {int(k): v for k, v in _I["campos"].items()}
    _PERFIL_DESC = _I["perfil"]

TOTAL_ITEMS = 180

# Estructura por campo derivada de preguntas.json (clave AC/PR fija por id).
_CODIGOS = sorted({it["campo"] for it in _ITEMS})
_ITEMS_CAMPO = {c: [it["id"] for it in _ITEMS if it["campo"] == c] for c in _CODIGOS}
_AC_CAMPO = {c: [it["id"] for it in _ITEMS if it["campo"] == c and it["tipo"] == "AC"] for c in _CODIGOS}
_PR_CAMPO = {c: [it["id"] for it in _ITEMS if it["campo"] == c and it["tipo"] == "PR"] for c in _CODIGOS}


def _round_half_up(x: float) -> int:
    """Replica JS Math.round (half-up) para valores no negativos."""
    return math.floor(x + 0.5)


def _normalizar(respuestas: Mapping[int, int] | Sequence[int]) -> dict[int, int]:
    """Acepta dict {id: valor} o lista de 180 valores (posición 0 = ítem 1)."""
    if isinstance(respuestas, Mapping):
        return {int(k): int(v) for k, v in respuestas.items()}
    return {i + 1: int(v) for i, v in enumerate(respuestas)}


def _nivel_por_pd(pd_total: int) -> dict:
    """Nivel por intervalo cerrado [min,max]; primer match (orden del .gs)."""
    for n in _NIVELES:
        if n["min"] <= pd_total <= n["max"]:
            return n
    return _NIVELES[-1]


def calcular_puntuaciones(respuestas: Mapping[int, int]) -> dict[int, dict]:
    """Port de calcularPuntuacionesIPPR: PD por campo (0-36). respuestas: {id: 0-3}."""
    resultado = {}
    for cod in _CODIGOS:
        pd_total = pd_ac = pd_pr = n_nc = 0
        for iid in _ITEMS_CAMPO[cod]:
            v = respuestas.get(iid, 0)
            pd_total += v
            if v == 0:
                n_nc += 1
        for iid in _AC_CAMPO[cod]:
            pd_ac += respuestas.get(iid, 0)
        for iid in _PR_CAMPO[cod]:
            pd_pr += respuestas.get(iid, 0)

        porcentaje = _round_half_up((pd_total / _PD_MAX) * 100)
        nivel = _nivel_por_pd(pd_total)
        meta = _CAMPOS_META[cod]

        resultado[cod] = {
            "codigo": cod,
            "nombre": meta["nombre"],
            "emoji": meta["emoji"],
            "pd_total": pd_total,
            "pd_ac": pd_ac,
            "pd_pr": pd_pr,
            "pd_max": _PD_MAX,
            "porcentaje": porcentaje,
            "n_nc": n_nc,
            "nivel": nivel["nombre"],
            "color": nivel["color"],
            "colorFondo": nivel["colorFondo"],
            "descripcion": meta["descripcion"],
            "actividades": meta["actividades"],
            "profesiones": meta["profesiones"],
            "carreras": meta["carreras_universitarias"],
        }
    return resultado


def analizar_perfil(puntuaciones: Mapping[int, dict]) -> dict:
    """Port de analizarPerfil: ranking, tipo de perfil y discrepancias AC/PR."""
    # Orden estable de mayor a menor PD (Array.sort de JS es estable en V8 moderno).
    ordenados = sorted(puntuaciones.values(), key=lambda c: -c["pd_total"])

    primarios = ordenados[:3]
    secundarios = [c for c in ordenados[3:] if c["pd_total"] >= _P["umbral_secundario_pd"]]
    rechazos = [c for c in ordenados if c["pd_total"] <= _P["umbral_rechazo_pd"]]
    desconocidos = [c for c in ordenados if c["n_nc"] >= _P["umbral_nc_desconocido"]]

    maxv = ordenados[0]["pd_total"]
    minv = ordenados[-1]["pd_total"]
    rango = maxv - minv
    n_altos = sum(1 for c in ordenados if c["pd_total"] >= _P["umbral_alto_pd"])

    if rango <= 8:
        tipo = "Plano"
    elif n_altos >= 6:
        tipo = "Alto generalizado"
    elif 2 <= n_altos <= 4:
        tipo = "Diferenciado"
    else:
        tipo = "Disperso"
    desc = _PERFIL_DESC[tipo]

    discrepancias = []
    for campo in primarios:
        diff = campo["pd_ac"] - campo["pd_pr"]
        if abs(diff) >= _P["discrepancia_acpr_min"]:
            discrepancias.append({
                "nombre": campo["nombre"],
                "pd_ac": campo["pd_ac"],
                "pd_pr": campo["pd_pr"],
                "tipo": "AC_MAYOR" if diff > 0 else "PR_MAYOR",
            })

    return {
        "ordenados": ordenados,
        "primarios": primarios,
        "secundarios": secundarios,
        "rechazos": rechazos,
        "desconocidos": desconocidos,
        "tipoPerfil": tipo,
        "descPerfil": desc,
        "discrepancias": discrepancias,
    }


def evaluar_validez(respuestas: Mapping[int, int], tiempo_segundos: int = 0) -> dict:
    """Port de evaluarValidez: validez de la aplicación."""
    respondidos = len(respuestas)
    total = TOTAL_ITEMS
    pct = _round_half_up((respondidos / total) * 100)

    nc = sum(1 for v in respuestas.values() if v == 0)
    pct_nc = _round_half_up((nc / respondidos) * 100) if respondidos else 0

    freq = [sum(1 for v in respuestas.values() if v == val) for val in (0, 1, 2, 3)]
    max_conc = _round_half_up((max(freq) / respondidos) * 100) if respondidos else 0

    tiempo_mins = tiempo_segundos / 60

    if respondidos < 90:
        etiqueta, color = "No válida", "#dc2626"
    elif respondidos < 126 or pct_nc > 50 or max_conc > 90:
        etiqueta, color = "Con cautela", "#d97706"
    else:
        etiqueta, color = "Válida", "#059669"

    alerta_tiempo = None
    if tiempo_mins < 10:
        alerta_tiempo = "Tiempo muy corto (< 10 min). Posible respuesta apresurada."
    if tiempo_mins > 60:
        alerta_tiempo = "Tiempo excesivo (> 60 min). Posible falta de concentración."

    return {
        "respondidos": respondidos,
        "total": total,
        "pct": pct,
        "nc": nc,
        "pctNC": pct_nc,
        "maxConc": max_conc,
        "tiempoSegundos": tiempo_segundos,
        "tiempoMins": tiempo_mins,
        "etiqueta": etiqueta,
        "color": color,
        "alertaTiempo": alerta_tiempo,
    }


def calcular(respuestas: Mapping[int, int] | Sequence[int], tiempo_segundos: int = 0) -> dict:
    """Calcula el perfil IPP-R completo. respuestas: {id 1-180: 0-3} o lista de 180."""
    r = _normalizar(respuestas)
    puntuaciones = calcular_puntuaciones(r)
    analisis = analizar_perfil(puntuaciones)
    validez = evaluar_validez(r, tiempo_segundos)
    return {
        "puntuaciones": puntuaciones,
        "analisis": analisis,
        "validez": validez,
    }


if __name__ == "__main__":
    import pprint
    pprint.pprint(calcular({i: 2 for i in range(1, 181)}))
