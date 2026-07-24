"""Runner de regresion para Toulouse-Pieron. Ejecutar: python test_scoring.py"""

import json
import math
from pathlib import Path

import scoring

_DIR = Path(__file__).parent

# Campos cuyo valor esperado es el 'nivel' anidado del baremo correspondiente.
_NIVEL_FIELDS = {"nivelAtencion", "nivelPrecision", "nivelVelocidad"}


def _build_input(caso: dict):
    if "input" in caso:
        return caso["input"]
    if "input_list" in caso:
        return caso["input_list"]
    if "input_rango" in caso:
        ini, fin = caso["input_rango"]
        return list(range(ini, fin))
    raise ValueError(f"Caso sin input: {caso['nombre']}")


def _float_eq(a, b) -> bool:
    return isinstance(a, (int, float)) and isinstance(b, (int, float)) and math.isclose(
        a, b, rel_tol=1e-9, abs_tol=1e-9
    )


def _real_value(res: dict, clave: str):
    if clave in _NIVEL_FIELDS:
        return res[clave]["nivel"]
    if clave == "perfil":
        return res["perfil"]["clave"]
    if clave.startswith("segmento_") and clave.endswith("_densidad"):
        n = int(clave.split("_")[1])
        return res["analisisPorSegmentos"][n - 1]["densidad"]
    return res.get(clave)


def run() -> int:
    casos = json.loads((_DIR / "regresion.json").read_text(encoding="utf-8"))["casos"]
    fallos = 0
    for caso in casos:
        res = scoring.calcular(_build_input(caso))
        errores = []
        for clave, esperado in caso["esperado"].items():
            real = _real_value(res, clave)
            ok = real == esperado or _float_eq(real, esperado)
            if not ok:
                errores.append(f"{clave}: esperado {esperado!r}, obtenido {real!r}")

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
