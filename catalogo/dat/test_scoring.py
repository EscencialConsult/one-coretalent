"""Runner de regresión para DAT. Ejecutar: python test_scoring.py"""

import json
from pathlib import Path

import scoring

_DIR = Path(__file__).parent

# Claves para construir respuestas correctas a partir de 'correctas': N.
_CLAVES = {
    st: {int(k): v for k, v in tabla.items()}
    for st, tabla in json.loads((_DIR / "baremos.json").read_text(encoding="utf-8"))["claves"].items()
    if not st.startswith("_")
}


def _build_respuestas(caso: dict) -> dict:
    """Construye el input para scoring.calcular a partir del caso de regresión."""
    psa = caso.get("psa", 0)
    if isinstance(psa, int):
        psa_resp = {str(i): "A" for i in range(1, psa + 1)}
    else:
        psa_resp = psa

    resp = {"PSA": psa_resp}
    for st in ["VR", "ORT", "NR", "AR", "SR"]:
        n = caso.get("correctas", {}).get(st, 0)
        ids = list(_CLAVES[st])[:n]
        resp[st] = {str(i): _CLAVES[st][i] for i in ids}
    return resp


def run() -> int:
    casos = json.loads((_DIR / "regresion.json").read_text(encoding="utf-8"))["casos"]
    fallos = 0
    for caso in casos:
        res = scoring.calcular(_build_respuestas(caso))
        esp = caso["esperado"]
        errores = []

        for st, campos in esp.get("subtests", {}).items():
            real = res["subtests"][st]
            for clave, valor in campos.items():
                if real.get(clave) != valor:
                    errores.append(f"{st}.{clave}: esperado {valor!r}, obtenido {real.get(clave)!r}")

        if "estilo_trabajo" in esp:
            real_estilo = res["estilo_trabajo"]["estilo"]
            if real_estilo != esp["estilo_trabajo"]:
                errores.append(f"estilo_trabajo: esperado {esp['estilo_trabajo']!r}, obtenido {real_estilo!r}")

        if "roles" in esp and res["roles"] != esp["roles"]:
            errores.append(f"roles: esperado {esp['roles']!r}, obtenido {res['roles']!r}")

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
