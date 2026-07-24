"""Runner de regresión para EBP. Ejecutar: python test_scoring.py"""

import json
from pathlib import Path

import scoring

_DIR = Path(__file__).parent

_RANGOS = {"section1": 40, "section2": 10, "section3": 25}


def _build_respuestas(caso: dict) -> dict:
    """Construye {section1, section2, section3} desde el caso.

    - fill_sectionN: rellena toda la sección (1..rango) con ese valor.
    - sectionN explícito (dict): se usa tal cual (claves str -> valor).
    Si ambos están presentes, el dict explícito tiene prioridad y se fusiona sobre el fill.
    """
    out = {}
    for sec, rango in _RANGOS.items():
        base = {}
        fill = caso.get(f"fill_{sec}")
        if fill is not None:
            base = {str(i): fill for i in range(1, rango + 1)}
        explicito = caso.get(sec)
        if explicito is not None:
            base = {**base, **{str(k): v for k, v in explicito.items()}}
        out[sec] = base
    return out


def run() -> int:
    casos = json.loads((_DIR / "regresion.json").read_text(encoding="utf-8"))["casos"]
    fallos = 0
    for caso in casos:
        res = scoring.calcular(_build_respuestas(caso))
        esp = caso["esperado"]
        errores = []

        if "pd_total" in esp and res["pd_total"] != esp["pd_total"]:
            errores.append(f"pd_total: esperado {esp['pd_total']}, obtenido {res['pd_total']}")

        for sub, campos in esp.get("subescalas", {}).items():
            real = res["subescalas"][sub]
            for clave, valor in campos.items():
                if real[clave] != valor:
                    errores.append(f"{sub}.{clave}: esperado {valor!r}, obtenido {real[clave]!r}")

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
