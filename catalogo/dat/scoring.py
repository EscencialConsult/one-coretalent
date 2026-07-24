"""
Motor de cálculo DETERMINISTA — DAT (Test de Aptitudes Diferenciales).

Port fiel de Test1/script.gs (parsearColumnas / calcularResultados /
generarTextosExpandidos). Sin IA: mismo input -> mismo output. Lógica aprobada, no se altera.

Entrada: respuestas del evaluado por subtest. Acepta dos formas (igual que el .gs):
  - dict por subtest de {id: LETRA}, p.ej. {"VR": {"1": "C", "2": "E", ...}, ...}
  - dict por subtest con el string crudo del front, p.ej. {"VR": "1;C, 2;E, ..."}
  Para PSA basta con la lista/string/dict de respuestas dadas (sólo se cuentan).

Salida: por subtest (PSA/VR/ORT/NR/AR/SR): raw, total, pct, nivel, interpretacion;
  + estilo_trabajo y roles (áreas de máximo potencial).
"""

from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Mapping

_DIR = Path(__file__).parent

with (_DIR / "baremos.json").open(encoding="utf-8") as _f:
    _B = json.load(_f)
    _CLAVES = {
        st: {int(k): v for k, v in tabla.items()}
        for st, tabla in _B["claves"].items()
        if not st.startswith("_")
    }
    _NIVELES = _B["niveles_aptitud"]["umbral_descendente"]
    _ESTILO_REGLAS = _B["estilo_trabajo"]["reglas"]
    _ROLES_REGLAS = _B["roles"]["reglas"]
    _ROLES_DEFAULT = _B["roles"]["default"]
with (_DIR / "interpretaciones.json").open(encoding="utf-8") as _f:
    _INTERP = json.load(_f)
    _INTERP_APT = _INTERP["aptitudes"]
    _INTERP_TRABAJO = _INTERP["estilo_trabajo"]
with (_DIR / "preguntas.json").open(encoding="utf-8") as _f:
    _NOMBRES = {st: d["nombre"] for st, d in json.load(_f)["subtests"].items()}

# Subtests corregidos por clave (PSA no: se cuentan respuestas).
_SUBTESTS_CLAVE = ["VR", "ORT", "NR", "AR", "SR"]
# Subtests con bloque de interpretación de aptitud en el legacy.
_SUBTESTS_INTERP = ["VR", "NR", "AR", "SR"]


def _round_half_up(x: float) -> int:
    """Replica JS Math.round (half-up) para valores no negativos."""
    return math.floor(x + 0.5)


def _parse_cell(valor) -> dict[int, str]:
    """Replica cleanCell del .gs: parsea un string '1;C, 2:E, ...' (o dict) a {id:int -> LETRA}.

    Acepta separadores ';' o ':' entre id y letra, ',' entre pares, e ignora llaves {}.
    Si el id viene como 'p-1' toma el último segmento tras '-'. Sólo ids numéricos.
    Si ya es un dict, se normaliza a {int: str.upper()}.
    """
    if isinstance(valor, Mapping):
        out: dict[int, str] = {}
        for k, v in valor.items():
            ks = str(k)
            key = ks.split("-")[-1].strip() if "-" in ks else ks.strip()
            val = str(v).strip().upper()
            if key and val and key.lstrip("-").isdigit():
                out[int(key)] = val
        return out

    out = {}
    if not valor or not isinstance(valor, str):
        return out
    limpio = re.sub(r"[{}]", "", valor)
    for item in limpio.split(","):
        parts = item.split(";") if ";" in item else item.split(":")
        if len(parts) >= 2:
            raw_key = parts[0]
            key = raw_key.split("-")[-1].strip() if "-" in raw_key else raw_key.strip()
            val = parts[1].strip().upper()
            if key and val and key.lstrip("-").isdigit():
                out[int(key)] = val
    return out


def _calcular_prueba(respuestas_test: dict[int, str], claves_test: dict[int, str]) -> dict:
    """Replica calcularPrueba del .gs: itera sobre las CLAVES (total = nº de claves)."""
    correctas = 0
    total = 0
    for num in claves_test:
        total += 1
        if respuestas_test.get(num) and respuestas_test[num] == claves_test[num]:
            correctas += 1
    pct = _round_half_up((correctas / total) * 100) if total > 0 else 0
    return {"raw": correctas, "total": total, "pct": pct}


def _nivel_por_pct(pct: int) -> str:
    """Replica getBlock del .gs: ALTO>=70, MEDIO>=40, resto BAJO."""
    for u in _NIVELES:
        if pct >= u["min_pct"]:
            return u["nivel"]
    return _NIVELES[-1]["nivel"]


def _cumple(cond: dict, psa: int, ort: int) -> bool:
    if "psa_gt" in cond and not (psa > cond["psa_gt"]):
        return False
    if "psa_lt" in cond and not (psa < cond["psa_lt"]):
        return False
    if "ort_gt" in cond and not (ort > cond["ort_gt"]):
        return False
    if "ort_lt" in cond and not (ort < cond["ort_lt"]):
        return False
    return True


def _estilo_trabajo(psa: int, ort: int) -> str:
    for regla in _ESTILO_REGLAS:
        cond = regla["condicion"]
        if cond == "default":
            return regla["estilo"]
        if _cumple(cond, psa, ort):
            return regla["estilo"]
    return "ESTANDAR"


def _roles(pcts: dict[str, int]) -> list[str]:
    roles = [r["rol"] for r in _ROLES_REGLAS if pcts[r["subtest"]] > r["gt"]]
    if not roles:
        roles.append(_ROLES_DEFAULT)
    return roles


def calcular(respuestas: dict) -> dict:
    """Calcula el perfil DAT.

    respuestas: dict con claves de subtest (PSA, VR, ORT, NR, AR, SR). Para cada subtest
    el valor puede ser un dict {id: LETRA} o el string crudo del front '1;C, 2;E, ...'.
    """
    parsed = {st: _parse_cell(respuestas.get(st)) for st in ["PSA", *_SUBTESTS_CLAVE]}

    # PSA: nº de respuestas dadas (cap 100). No usa clave.
    psa_count = len(parsed["PSA"])
    if psa_count > 100:
        psa_count = 100

    subtests: dict[str, dict] = {
        "PSA": {"nombre": _NOMBRES["PSA"], "pct": psa_count}
    }
    for st in _SUBTESTS_CLAVE:
        res = _calcular_prueba(parsed[st], _CLAVES[st])
        entry = {"nombre": _NOMBRES[st], "raw": res["raw"], "total": res["total"], "pct": res["pct"]}
        if st in _SUBTESTS_INTERP:
            nivel = _nivel_por_pct(res["pct"])
            interp = _INTERP_APT[st][nivel]
            entry["nivel"] = nivel
            entry["interpretacion"] = interp
        subtests[st] = entry

    psa = subtests["PSA"]["pct"]
    ort = subtests["ORT"]["pct"]
    estilo = _estilo_trabajo(psa, ort)

    pcts = {st: subtests[st]["pct"] for st in _SUBTESTS_CLAVE}
    roles = _roles(pcts)

    return {
        "subtests": subtests,
        "estilo_trabajo": {
            "estilo": estilo,
            "interpretacion": _INTERP_TRABAJO[estilo],
        },
        "roles": roles,
        "roles_texto": " • ".join(roles),
    }


if __name__ == "__main__":
    import pprint

    demo = {
        "PSA": "1;A, 2;B, 3;C",
        "VR": {str(i): "C" for i in range(1, 51)},
        "ORT": {},
        "NR": {},
        "AR": {},
        "SR": {},
    }
    pprint.pprint(calcular(demo))
