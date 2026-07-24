"""Runner de regresión para DNLA Perfil Comercial. Ejecutar: python test_scoring.py"""

import json
from pathlib import Path

import scoring

_DIR = Path(__file__).parent

_DIM_ITEMS = {
    "iniciativa_proactividad": [1, 2, 3, 4, 5],
    "comunicacion_persuasiva": [6, 7, 8, 9, 10],
    "escucha_empatia": [11, 12, 13, 14, 15],
    "orientacion_cliente": [16, 17, 18, 19, 20],
    "resiliencia_rechazo": [21, 22, 23, 24, 25],
}


def _build_input(caso: dict):
    if "texto" in caso:
        return caso["texto"]
    if "fill" in caso:
        return {i: caso["fill"] for i in range(1, 26)}
    if "por_dimension" in caso:
        base = {}
        for dim, val in caso["por_dimension"].items():
            for i in _DIM_ITEMS[dim]:
                base[i] = val
        return base
    base = {i: caso.get("fill_resto", 3) for i in range(1, 26)}
    for k, v in caso.get("respuestas", {}).items():
        base[int(k)] = v
    return base


def run() -> int:
    casos = json.loads((_DIR / "regresion.json").read_text(encoding="utf-8"))["casos"]
    fallos = 0
    for caso in casos:
        res = scoring.calcular(_build_input(caso))
        esp = caso["esperado"]
        errores = []

        for clave in ("promedio_global", "nivel_global", "badge_global"):
            if clave in esp and res[clave] != esp[clave]:
                errores.append(f"{clave}: esperado {esp[clave]!r}, obtenido {res[clave]!r}")

        for dim, campos in esp.get("dimensiones", {}).items():
            real = res["dimensiones"][dim]
            for clave, valor in campos.items():
                if real[clave] != valor:
                    errores.append(f"{dim}.{clave}: esperado {valor!r}, obtenido {real[clave]!r}")

        if "fortalezas_claves" in esp:
            reales = [f["clave"] for f in res["fortalezas"]]
            if reales != esp["fortalezas_claves"]:
                errores.append(f"fortalezas: esperado {esp['fortalezas_claves']}, obtenido {reales}")
        if "areas_claves" in esp:
            reales = [a["clave"] for a in res["areas_mejora"]]
            if reales != esp["areas_claves"]:
                errores.append(f"areas_mejora: esperado {esp['areas_claves']}, obtenido {reales}")

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
