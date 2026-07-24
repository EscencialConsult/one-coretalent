"""Runner de regresión para el Test de Kuder. Ejecutar: python test_scoring.py"""

import json
from pathlib import Path

import scoring

_DIR = Path(__file__).parent
_N = scoring._N_SCORING  # 165


def _build_respuestas(caso: dict) -> list:
    """Construye la lista de 165 respuestas {mas,menos} a partir del caso."""
    resp = [None] * _N
    if "patron" in caso:
        p = caso["patron"]
        return [{"mas": p["mas"], "menos": p["menos"]} for _ in range(_N)]
    if "segmentos" in caso:
        for seg in caso["segmentos"]:
            for i in range(seg["desde"], seg["hasta"]):
                resp[i] = {"mas": seg["mas"], "menos": seg["menos"]}
    # Cualquier hueco no cubierto se deja como incoherente neutro (no debería ocurrir).
    return [r if r is not None else {"mas": 0, "menos": 0} for r in resp]


def run() -> int:
    casos = json.loads((_DIR / "regresion.json").read_text(encoding="utf-8"))["casos"]
    fallos = 0
    for caso in casos:
        res = scoring.calcular(_build_respuestas(caso))
        esp = caso["esperado"]
        errores = []

        for clave in ("puntajesDirectos", "verificacion", "estadoValidez", "esValido", "codigoPerfil"):
            if clave in esp and res[clave] != esp[clave]:
                errores.append(f"{clave}: esperado {esp[clave]!r}, obtenido {res[clave]!r}")

        if "percentiles" in esp:
            obtenido = [p["percentil"] for p in res["percentiles"]]
            if obtenido != esp["percentiles"]:
                errores.append(f"percentiles: esperado {esp['percentiles']}, obtenido {obtenido}")

        if "niveles" in esp:
            obtenido = [p["nivel"] for p in res["percentiles"]]
            if obtenido != esp["niveles"]:
                errores.append(f"niveles: esperado {esp['niveles']}, obtenido {obtenido}")

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
