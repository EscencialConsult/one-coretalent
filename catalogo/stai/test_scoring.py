"""Runner de regresión para STAI. Ejecutar: python test_scoring.py"""

import json
from pathlib import Path

import scoring

_DIR = Path(__file__).parent


def _build_respuestas(caso: dict) -> dict:
    if "fill" in caso:
        return {i: caso["fill"] for i in range(1, 41)}
    resto = caso.get("fill_resto", None)
    base = {} if resto is None else {i: resto for i in range(1, 41)}
    for k, v in caso.get("respuestas", {}).items():
        base[int(k)] = v
    return base


def run() -> int:
    casos = json.loads((_DIR / "regresion.json").read_text(encoding="utf-8"))["casos"]
    fallos = 0
    for caso in casos:
        res = scoring.calcular(
            _build_respuestas(caso),
            ya_invertidas=caso.get("ya_invertidas", False),
        )
        esp = caso["esperado"]
        errores = []

        for clave in ("pd_estado", "pd_rasgo", "relacion_estado_rasgo"):
            if clave in esp and res[clave] != esp[clave]:
                errores.append(f"{clave}: esperado {esp[clave]!r}, obtenido {res[clave]!r}")

        for esc, campos in esp.get("escalas", {}).items():
            real = res["escalas"][esc]
            for clave, valor in campos.items():
                if real.get(clave) != valor:
                    errores.append(f"escalas.{esc}.{clave}: esperado {valor!r}, obtenido {real.get(clave)!r}")

        for fac, campos in esp.get("factores", {}).items():
            real = res["factores"][fac]
            for clave, valor in campos.items():
                if real.get(clave) != valor:
                    errores.append(f"factores.{fac}.{clave}: esperado {valor!r}, obtenido {real.get(clave)!r}")

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
