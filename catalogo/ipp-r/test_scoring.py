"""Runner de regresión para IPP-R. Ejecutar: python test_scoring.py"""

import json
from pathlib import Path

import scoring

_DIR = Path(__file__).parent


def _build_respuestas(caso: dict) -> dict:
    if "fill" in caso:
        return {i: caso["fill"] for i in range(1, 181)}
    if caso.get("respuestas_patron_ciclico"):
        # Patrón determinista 0,1,2,3 según i % 4 (igual que el generador de regresión).
        vals = [0, 1, 2, 3]
        return {i: vals[i % 4] for i in range(1, 181)}
    if "fill_resto" in caso:
        base = {i: caso["fill_resto"] for i in range(1, 181)}
        for k, v in caso.get("respuestas", {}).items():
            base[int(k)] = v
        return base
    return {int(k): v for k, v in caso.get("respuestas", {}).items()}


def run() -> int:
    casos = json.loads((_DIR / "regresion.json").read_text(encoding="utf-8"))["casos"]
    fallos = 0
    for caso in casos:
        r = _build_respuestas(caso)
        res = scoring.calcular(r, caso.get("tiempo_segundos", 0))
        esp = caso["esperado"]
        errores = []

        if "tipoPerfil" in esp and res["analisis"]["tipoPerfil"] != esp["tipoPerfil"]:
            errores.append(f"tipoPerfil: esperado {esp['tipoPerfil']!r}, obtenido {res['analisis']['tipoPerfil']!r}")

        for clave, valor in esp.get("validez", {}).items():
            real = res["validez"].get(clave)
            if real != valor:
                errores.append(f"validez.{clave}: esperado {valor!r}, obtenido {real!r}")

        for cod, campos in esp.get("campos", {}).items():
            real = res["puntuaciones"][int(cod)]
            for clave, valor in campos.items():
                if real.get(clave) != valor:
                    errores.append(f"campo[{cod}].{clave}: esperado {valor!r}, obtenido {real.get(clave)!r}")

        if "discrepancias" in esp:
            real_d = res["analisis"]["discrepancias"]
            if real_d != esp["discrepancias"]:
                errores.append(f"discrepancias: esperado {esp['discrepancias']!r}, obtenido {real_d!r}")

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
