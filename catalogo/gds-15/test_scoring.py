"""Runner de regresión para GDS-15. Ejecutar: python test_scoring.py"""

import json
from pathlib import Path

import scoring

_DIR = Path(__file__).parent


def _build_respuestas(caso: dict) -> dict:
    return {int(k): v for k, v in caso.get("respuestas", {}).items()}


def run() -> int:
    casos = json.loads((_DIR / "regresion.json").read_text(encoding="utf-8"))["casos"]
    fallos = 0
    for caso in casos:
        res = scoring.calcular(_build_respuestas(caso))
        esp = caso["esperado"]
        errores = []

        for clave, valor in esp.items():
            if clave == "desglose":
                for dk, dv in valor.items():
                    if res["desglose"][dk] != dv:
                        errores.append(f"desglose.{dk}: esperado {dv!r}, obtenido {res['desglose'][dk]!r}")
            elif res.get(clave) != valor:
                errores.append(f"{clave}: esperado {valor!r}, obtenido {res.get(clave)!r}")

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
