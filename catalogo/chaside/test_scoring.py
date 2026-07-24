"""Runner de regresión para CHASIDE. Ejecutar: python test_scoring.py"""

import json
from pathlib import Path

import scoring

_DIR = Path(__file__).parent


def _build_respuestas(caso: dict) -> dict:
    """Construye {id 1-98: 'SI'/'NO'} a partir del caso.

    'fill' = todas las respuestas con ese valor.
    'si' = lista de ids con 'SI'; el resto 'NO'.
    'respuestas' = dict id->valor; 'fill_resto' completa los no listados (def. 'NO').
    """
    if "fill" in caso:
        return {i: caso["fill"] for i in range(1, 99)}
    if "si" in caso:
        si = {int(x) for x in caso["si"]}
        return {i: ("SI" if i in si else "NO") for i in range(1, 99)}
    base = {i: caso.get("fill_resto", "NO") for i in range(1, 99)}
    for k, v in caso.get("respuestas", {}).items():
        base[int(k)] = v
    return base


def _get(res: dict, area_letra: str) -> dict:
    for a in res["areasResultado"]:
        if a["letra"] == area_letra:
            return a
    raise KeyError(area_letra)


def run() -> int:
    casos = json.loads((_DIR / "regresion.json").read_text(encoding="utf-8"))["casos"]
    fallos = 0
    for caso in casos:
        res = scoring.calcular(_build_respuestas(caso))
        esp = caso["esperado"]
        errores = []

        for clave in ("codigoPerfil", "totalSI", "totalNO"):
            if clave in esp and res[clave] != esp[clave]:
                errores.append(f"{clave}: esperado {esp[clave]!r}, obtenido {res[clave]!r}")

        if "profesionesCombinadas" in esp and res["profesionesCombinadas"] != esp["profesionesCombinadas"]:
            errores.append(f"profesionesCombinadas: esperado {esp['profesionesCombinadas']!r}, obtenido {res['profesionesCombinadas']!r}")

        if "top2" in esp:
            real_top2 = [a["letra"] for a in res["top2"]]
            if real_top2 != esp["top2"]:
                errores.append(f"top2: esperado {esp['top2']}, obtenido {real_top2}")

        if "areasOrdenadas" in esp:
            real_orden = [a["letra"] for a in res["areasOrdenadas"]]
            if real_orden != esp["areasOrdenadas"]:
                errores.append(f"areasOrdenadas: esperado {esp['areasOrdenadas']}, obtenido {real_orden}")

        for letra, campos in esp.get("areas", {}).items():
            real = _get(res, letra)
            for clave, valor in campos.items():
                if real[clave] != valor:
                    errores.append(f"{letra}.{clave}: esperado {valor!r}, obtenido {real[clave]!r}")

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
