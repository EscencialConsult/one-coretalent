"""Motor de cálculo DETERMINISTA — Eneagrama (90 ítems, 10 por eneatipo).

Port fiel de `Informe/calculoEneagramaTotal.js` (plataforma-eneagrama):
- Normalización ABSOLUTA por tipo: (raw - min) / (max - min) × 100, con
  min = n_respondidas × 1 y max = n_respondidas × 5 (todo 1 = 0%, todo 5 = 100%).
- Tipo BASE = el de mayor score. Empate → menor número (estable).
- ALAS = los 2 tipos de mayor score después del base.
- FLECHAS: integración/desintegración según el mapa del eneagrama.
Sin IA: mismo input → mismo output.

Entrada:  respuestas por ítem en escala 1-5.
          - dict con claves base-0 (formato del front: {"0":v, …, "89":v}),
          - dict con ids base-1 (1..90),
          - o lista/secuencia de valores (posición 0 = primer ítem).
Salida:   base + alas + flechas, scores 0-100 por eneatipo, ranking e interpretación
          completa del tipo base (para el informe).
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Mapping, Sequence

_DIR = Path(__file__).parent

with (_DIR / "preguntas.json").open(encoding="utf-8") as _f:
    _P = json.load(_f)
    _ITEMS = _P["items"]
    # indice base-0 -> eneatipo (1-9)
    _TIPO_POR_INDICE = {int(it["indice"]): int(it["eneatipo"]) for it in _ITEMS}

with (_DIR / "interpretaciones.json").open(encoding="utf-8") as _f:
    _I = json.load(_f)
    _TIPOS = {int(k): v for k, v in _I["tipos"].items()}
    _FLECHAS = {int(k): v for k, v in _I["flechas"].items()}

ENEATIPOS = list(range(1, 10))
_N_ITEMS = len(_ITEMS)


def _valido(v) -> bool:
    return v is not None and str(v).strip() != ""


def _normalizar(respuestas: Mapping | Sequence) -> dict[int, int]:
    """Devuelve {indice_base_0: valor}. Acepta dict base-0, dict base-1 o secuencia."""
    if isinstance(respuestas, Mapping):
        claves = {int(k): int(v) for k, v in respuestas.items() if _valido(v)}
        # base-1 (1..90) sin la clave 0 → convertir a base-0
        if 0 not in claves and _N_ITEMS in claves:
            return {k - 1: v for k, v in claves.items()}
        return claves
    return {i: int(v) for i, v in enumerate(respuestas) if _valido(v)}


def _nombre(t: int) -> str:
    return _TIPOS[t]["nombre"]


def _perfil(t: int, pct: int) -> dict:
    d = _TIPOS[t]
    return {
        "tipo": t,
        "nombre": d.get("nombre"),
        "subtitulo": d.get("subtitulo"),
        "descripcion": d.get("descripcion"),
        "porcentaje": pct,
        "emocion_basica": d.get("emocionBasica"),
        "motivacion": d.get("motivacionProfunda"),
        "miedo": d.get("miedoProfundo"),
        "deseo": d.get("deseoBasico"),
        "pecado_capital": d.get("pecadoCapital"),
        "virtud": d.get("virtud"),
        "fortalezas": d.get("fortalezas", []),
        "areas_desarrollo": d.get("areas_desarrollo", []),
        "en_trabajo": d.get("en_trabajo"),
        "en_equipo": d.get("en_equipo"),
        "camino_crecimiento": d.get("camino_crecimiento"),
        "niveles": d.get("niveles", {}),
    }


def calcular(respuestas: Mapping | Sequence) -> dict:
    """Calcula el perfil de Eneagrama. respuestas en escala 1-5 (ver módulo)."""
    r = _normalizar(respuestas)

    raw = {t: 0 for t in ENEATIPOS}
    cnt = {t: 0 for t in ENEATIPOS}
    for idx, tipo in _TIPO_POR_INDICE.items():
        v = r.get(idx)
        if v is None:
            continue
        v = int(v)
        if 1 <= v <= 5:
            raw[tipo] += v
            cnt[tipo] += 1

    scores: dict[int, int] = {}
    for t in ENEATIPOS:
        n = cnt[t]
        lo, hi = n * 1, n * 5
        if n == 0 or hi == lo:
            scores[t] = 0
        else:
            s = round(((raw[t] - lo) / (hi - lo)) * 100)
            scores[t] = max(0, min(100, int(s)))

    # Base = mayor score; en empate gana el eneatipo de MENOR número.
    base = max(ENEATIPOS, key=lambda t: (scores[t], -t))
    # Alas = los 2 de mayor score (excluyendo base); empate → menor número.
    otros = sorted((t for t in ENEATIPOS if t != base), key=lambda t: (-scores[t], t))
    ala1, ala2 = otros[0], otros[1]

    integ = _FLECHAS[base]["integracion"]
    desint = _FLECHAS[base]["desintegracion"]

    roles = {base: "base", ala1: "ala", ala2: "ala"}
    ranking = sorted(
        (
            {"tipo": t, "nombre": _nombre(t), "porcentaje": scores[t], "rol": roles.get(t)}
            for t in ENEATIPOS
        ),
        key=lambda x: (-x["porcentaje"], x["tipo"]),
    )

    return {
        "notacion": f"{base}w{ala1}",
        "base": base,
        "base_nombre": _nombre(base),
        "scores": {str(t): scores[t] for t in ENEATIPOS},
        "ranking": ranking,
        "ala1": {"tipo": ala1, "nombre": _nombre(ala1), "porcentaje": scores[ala1]},
        "ala2": {"tipo": ala2, "nombre": _nombre(ala2), "porcentaje": scores[ala2]},
        "integracion": {"tipo": integ, "nombre": _nombre(integ)},
        "desintegracion": {"tipo": desint, "nombre": _nombre(desint)},
        "perfil": _perfil(base, scores[base]),
    }


if __name__ == "__main__":
    import pprint

    # Sanity: respuestas altas en tipo 5, bajas en el resto → base = 5.
    demo = {i: (5 if _TIPO_POR_INDICE[i] == 5 else 2) for i in range(_N_ITEMS)}
    pprint.pprint(calcular(demo))
