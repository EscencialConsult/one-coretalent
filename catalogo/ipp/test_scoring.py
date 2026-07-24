"""Runner de regresión para IPP. Ejecutar: python test_scoring.py"""

import json
from pathlib import Path

import scoring

_DIR = Path(__file__).parent


def _build_respuestas(caso: dict) -> dict:
    if "fill" in caso:
        return {i: caso["fill"] for i in range(1, 109)}
    if "fill_resto" in caso:
        base = {i: caso["fill_resto"] for i in range(1, 109)}
    else:
        base = {}
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

        if "tipo_perfil" in esp and res["tipo_perfil"] != esp["tipo_perfil"]:
            errores.append(f"tipo_perfil: esperado {esp['tipo_perfil']}, obtenido {res['tipo_perfil']}")

        if "rango" in esp and res["rango"] != esp["rango"]:
            errores.append(f"rango: esperado {esp['rango']}, obtenido {res['rango']}")

        if "campos_predominantes" in esp:
            real = [c["codigo"] for c in res["campos_predominantes"]]
            if real != esp["campos_predominantes"]:
                errores.append(f"campos_predominantes: esperado {esp['campos_predominantes']}, obtenido {real}")

        if "campos_rechazados" in esp:
            real = [c["codigo"] for c in res["campos_rechazados"]]
            if real != esp["campos_rechazados"]:
                errores.append(f"campos_rechazados: esperado {esp['campos_rechazados']}, obtenido {real}")

        for cod, campos in esp.get("campos", {}).items():
            real = res["campos"][cod]
            for clave, valor in campos.items():
                if real[clave] != valor:
                    errores.append(f"{cod}.{clave}: esperado {valor!r}, obtenido {real[clave]!r}")

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
