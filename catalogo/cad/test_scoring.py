"""Runner de regresión para CAD. Ejecutar: python test_scoring.py"""

import json
from pathlib import Path

import scoring

_DIR = Path(__file__).parent
_N_ITEMS = 31


def _build_respuestas(caso: dict) -> dict:
    if "fill" in caso:
        return {i: caso["fill"] for i in range(1, _N_ITEMS + 1)}
    base = {i: caso.get("fill_resto", 2) for i in range(1, _N_ITEMS + 1)}
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

        for escala, campos in esp.get("escalas", {}).items():
            real = res["escalas"][escala]
            for clave, valor in campos.items():
                if real[clave] != valor:
                    errores.append(f"{escala}.{clave}: esperado {valor!r}, obtenido {real[clave]!r}")

        if "ranking" in esp:
            for pos in ("top", "bottom"):
                if pos not in esp["ranking"]:
                    continue
                real_keys = [x["key"] for x in res["ranking"][pos]]
                esp_keys = esp["ranking"][pos]
                if real_keys != esp_keys:
                    errores.append(f"ranking.{pos}: esperado {esp_keys}, obtenido {real_keys}")

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
