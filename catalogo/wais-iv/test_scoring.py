"""Runner de regresión para WAIS-IV. Ejecutar: python test_scoring.py"""

import json
from pathlib import Path

import scoring

_DIR = Path(__file__).parent

_P = json.loads((_DIR / "preguntas.json").read_text(encoding="utf-8"))
_K1 = {it["id"]: it["correct"] for it in _P["parte1"]}
_K2 = {it["id"]: it["correct"] for it in _P["parte2"]}


def _build_input(caso: dict):
    """Construye el input de scoring.calcular a partir del caso de regresión."""
    if caso.get("raw_perfecto"):
        p1 = ", ".join(f"{i};{_K1[i]}" for i in range(1, 51))
        p2 = ", ".join(f"{i};{_K2[i]}" for i in range(1, 51))
        return "{PI: 0m 55s - " + p1 + "} {PII: 1m 11s - " + p2 + "}"

    preset = caso.get("preset")
    if preset == "perfecto":
        return {"parte1": dict(_K1), "parte2": dict(_K2)}
    if preset == "vacio":
        return {"parte1": {}, "parte2": {}}
    if preset == "solo_icv":
        p1 = {i: _K1[i] for i in range(1, 26)}
        p1.update({i: "z" for i in range(26, 51)})
        return {"parte1": p1, "parte2": {i: "z" for i in range(1, 51)}}
    if preset == "mixto":
        # ICV 15/25, IRP 20/25, IMT 10/25, IVP 5/25
        p1 = {}
        for i in range(1, 26):
            p1[i] = _K1[i] if i <= 15 else "z"
        for i in range(26, 51):
            p1[i] = _K1[i] if i <= 45 else "z"
        p2 = {}
        for i in range(1, 26):
            p2[i] = _K2[i] if i <= 10 else "z"
        for i in range(26, 51):
            p2[i] = _K2[i] if i <= 30 else "z"
        return {"parte1": p1, "parte2": p2}

    # fill_parteN / dicts explícitos
    p1 = {}
    p2 = {}
    if "fill_parte1" in caso:
        p1 = {i: caso["fill_parte1"] for i in range(1, 51)}
    if "fill_parte2" in caso:
        p2 = {i: caso["fill_parte2"] for i in range(1, 51)}
    p1.update({int(k): v for k, v in caso.get("parte1", {}).items()})
    p2.update({int(k): v for k, v in caso.get("parte2", {}).items()})
    return {"parte1": p1, "parte2": p2}


def _check(res: dict, esp: dict, errores: list, prefijo: str = "") -> None:
    for clave, valor in esp.items():
        real = res.get(clave)
        if isinstance(valor, dict):
            _check(real or {}, valor, errores, prefijo + clave + ".")
        elif real != valor:
            errores.append(f"{prefijo}{clave}: esperado {valor!r}, obtenido {real!r}")


def run() -> int:
    casos = json.loads((_DIR / "regresion.json").read_text(encoding="utf-8"))["casos"]
    fallos = 0
    for caso in casos:
        res = scoring.calcular(_build_input(caso))
        errores = []
        _check(res, caso["esperado"], errores)
        estado = "OK  " if not errores else "FALLA"
        if errores:
            fallos += 1
        print(f"[{estado}] {caso['nombre']}")
        for e in errores:
            print(f"        - {e}")
    print(f"\n{len(casos) - fallos}/{len(casos)} casos OK")
    return 1 if fallos else 0


if __name__ == "__main__":
    raise SystemExit(run())
