"""Runner de regresión para Bar-On EQ-i. Ejecutar: python test_scoring.py"""

import json
from pathlib import Path

import scoring

_DIR = Path(__file__).parent


def _build_respuestas(caso: dict) -> dict:
    if "fill" in caso:
        return {i: caso["fill"] for i in range(1, 134)}
    if caso.get("patron") == "ciclo_2a6":
        return {i: 2 + (i % 5) for i in range(1, 134)}
    base = {i: caso.get("fill_resto", 4) for i in range(1, 134)}
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

        # CE Total
        for clave, valor in esp.get("ceTotal", {}).items():
            real = res["ceTotal"][clave]
            if real != valor:
                errores.append(f"ceTotal.{clave}: esperado {valor!r}, obtenido {real!r}")

        # Compuestas
        for code, campos in esp.get("compuestas", {}).items():
            real = res["compuestas"][code]
            for clave, valor in campos.items():
                if real[clave] != valor:
                    errores.append(f"compuestas.{code}.{clave}: esperado {valor!r}, obtenido {real[clave]!r}")

        # Subescalas
        for code, campos in esp.get("subescalas", {}).items():
            real = res["subescalas"][code]
            for clave, valor in campos.items():
                if real[clave] != valor:
                    errores.append(f"subescalas.{code}.{clave}: esperado {valor!r}, obtenido {real[clave]!r}")

        # Orden de fortalezas / debilidades (por código)
        if "fortalezas_codigos" in esp:
            real_cod = [f["codigo"] for f in res["fortalezas"]]
            if real_cod != esp["fortalezas_codigos"]:
                errores.append(f"fortalezas: esperado {esp['fortalezas_codigos']}, obtenido {real_cod}")
        if "debilidades_codigos" in esp:
            real_cod = [d["codigo"] for d in res["debilidades"]]
            if real_cod != esp["debilidades_codigos"]:
                errores.append(f"debilidades: esperado {esp['debilidades_codigos']}, obtenido {real_cod}")

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
