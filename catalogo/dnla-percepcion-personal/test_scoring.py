"""Runner de regresión para DNLA Percepción Personal. Ejecutar: python test_scoring.py"""

import json
from pathlib import Path

import scoring

_DIR = Path(__file__).parent


def _build_respuestas(caso: dict) -> dict:
    if "fill" in caso:
        return {i: caso["fill"] for i in range(1, 25)}
    base = {i: caso.get("fill_resto", 3) for i in range(1, 25)}
    for k, v in caso.get("respuestas", {}).items():
        base[int(k)] = v
    return base


def _get(obj, ruta):
    """Accede a obj por ruta tipo 'a.b.0.c' (claves de dict o índices de lista)."""
    cur = obj
    for parte in ruta.split("."):
        cur = cur[int(parte)] if isinstance(cur, list) else cur[parte]
    return cur


def run() -> int:
    casos = json.loads((_DIR / "regresion.json").read_text(encoding="utf-8"))["casos"]
    fallos = 0
    for caso in casos:
        res = scoring.calcular(_build_respuestas(caso), nombre=caso.get("nombre_evaluado", ""))
        errores = []
        for ruta, valor in caso["esperado"].items():
            real = _get(res, ruta)
            if real != valor:
                errores.append(f"{ruta}: esperado {valor!r}, obtenido {real!r}")

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
