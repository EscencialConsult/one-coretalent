"""Runner de regresión para Dominó 48. Ejecutar: python test_scoring.py

Lee regresion.json y verifica que scoring.calcular() reproduce los resultados esperados.
No requiere pytest (stdlib pura), aunque también es compatible si se desea.
"""

import json
from pathlib import Path

import scoring

_DIR = Path(__file__).parent
_CLAVE = scoring._CLAVE


def _build_respuestas(caso: dict) -> dict:
    if "respuestas" in caso:
        return {int(k): v for k, v in caso["respuestas"].items()}
    # Construir respuestas correctas para los ítems en 'aciertos'.
    return {i: list(_CLAVE[i]) for i in caso["aciertos"]}


def run() -> int:
    casos = json.loads((_DIR / "regresion.json").read_text(encoding="utf-8"))["casos"]
    fallos = 0
    for caso in casos:
        res = scoring.calcular(_build_respuestas(caso))
        esp = caso["esperado"]
        errores = []
        for clave in ("correctas", "porcentaje", "percentil", "nivel"):
            if clave in esp and res[clave] != esp[clave]:
                errores.append(f"{clave}: esperado {esp[clave]!r}, obtenido {res[clave]!r}")
        for tipo, pct in esp.get("tipologia", {}).items():
            real = res["analisis_por_tipo"][tipo]["porcentaje"]
            if real != pct:
                errores.append(f"tipologia[{tipo}]: esperado {pct}, obtenido {real}")
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
