"""Runner de regresión para Big Five. Ejecutar: python test_scoring.py"""

import json
from pathlib import Path

import scoring

_DIR = Path(__file__).parent


def _build_respuestas(caso: dict) -> dict:
    if "fill" in caso:
        return {i: caso["fill"] for i in range(1, 51)}
    base = {i: caso.get("fill_resto", 3) for i in range(1, 51)}
    for k, v in caso.get("respuestas", {}).items():
        base[int(k)] = v
    return base


def run() -> int:
    casos = json.loads((_DIR / "regresion.json").read_text(encoding="utf-8"))["casos"]
    fallos = 0
    for caso in casos:
        res = scoring.calcular(_build_respuestas(caso))
        esp = caso["esperado"]
        errores = []

        if "dimension_dominante" in esp and res["dimension_dominante"] != esp["dimension_dominante"]:
            errores.append(f"dominante: esperado {esp['dimension_dominante']}, obtenido {res['dimension_dominante']}")

        for dim, campos in esp.get("dimensiones", {}).items():
            real = res["dimensiones"][dim]
            for clave, valor in campos.items():
                if real[clave] != valor:
                    errores.append(f"{dim}.{clave}: esperado {valor!r}, obtenido {real[clave]!r}")

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
