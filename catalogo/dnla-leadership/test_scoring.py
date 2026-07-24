"""Runner de regresión para DNLA Leadership. Ejecutar: python test_scoring.py"""

import json
from pathlib import Path

import scoring

_DIR = Path(__file__).parent
_N = 40


def _build_respuestas(caso: dict) -> dict:
    if "fill" in caso:
        return {i: caso["fill"] for i in range(1, _N + 1)}
    base = {i: caso.get("fill_resto", 3) for i in range(1, _N + 1)}
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

        for clave, valor in esp.get("global", {}).items():
            if res["global"][clave] != valor:
                errores.append(f"global.{clave}: esperado {valor!r}, obtenido {res['global'][clave]!r}")

        for clave, valor in esp.get("sintesis", {}).items():
            if res["sintesis"][clave] != valor:
                errores.append(f"sintesis.{clave}: esperado {valor!r}, obtenido {res['sintesis'][clave]!r}")

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
