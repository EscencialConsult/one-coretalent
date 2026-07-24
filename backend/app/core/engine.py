"""Motor de tests: carga las definiciones y el scoring real desde la carpeta `catalogo/`.

`catalogo/` (en la raíz del repo) es la fuente única de verdad de la lógica de cada test.
Cada test tiene `preguntas.json` (reactivos) y `scoring.py` (cálculo determinista, sin IA).
"""
from __future__ import annotations

import importlib.util
import json
from functools import lru_cache
from pathlib import Path
from types import ModuleType
from typing import Any

# backend/app/core/engine.py -> parents[3] = raíz del repo (Plataforma-ONE)
_ROOT = Path(__file__).resolve().parents[3]
CATALOGO_DIR = _ROOT / "catalogo"


def _slug_dir(slug: str) -> Path:
    carpeta = CATALOGO_DIR / slug
    if not carpeta.is_dir():
        raise FileNotFoundError(f"No existe el test '{slug}' en el catálogo")
    return carpeta


@lru_cache(maxsize=None)
def _get_scoring_module(slug: str) -> ModuleType:
    """Importa dinámicamente el scoring.py del test (cacheado)."""
    archivo = _slug_dir(slug) / "scoring.py"
    if not archivo.exists():
        raise FileNotFoundError(f"El test '{slug}' no tiene scoring.py")
    spec = importlib.util.spec_from_file_location(f"catalogo_{slug}_scoring", archivo)
    if spec is None or spec.loader is None:
        raise ImportError(f"No se pudo cargar el scoring de '{slug}'")
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


@lru_cache(maxsize=None)
def cargar_preguntas(slug: str) -> dict[str, Any]:
    """Devuelve el contenido de preguntas.json del test."""
    archivo = _slug_dir(slug) / "preguntas.json"
    if not archivo.exists():
        raise FileNotFoundError(f"El test '{slug}' no tiene preguntas.json")
    return json.loads(archivo.read_text(encoding="utf-8"))


def calcular(slug: str, respuestas: Any) -> dict[str, Any]:
    """Ejecuta el cálculo determinista del test con las respuestas dadas."""
    modulo = _get_scoring_module(slug)
    if not hasattr(modulo, "calcular"):
        raise AttributeError(f"El scoring de '{slug}' no define la función calcular()")
    return modulo.calcular(respuestas)


def listar_catalogo() -> list[dict[str, Any]]:
    """Lista los tests del catálogo (leyendo cada manifest.json).

    `slug` = nombre de la carpeta (lo que usan los endpoints de tests).
    `tomable` = tiene preguntas.json (se puede rendir en la plataforma).
    """
    salida: list[dict[str, Any]] = []
    if not CATALOGO_DIR.is_dir():
        return salida
    for carpeta in sorted(CATALOGO_DIR.iterdir()):
        manifest = carpeta / "manifest.json"
        if not carpeta.is_dir() or not manifest.exists():
            continue
        try:
            m = json.loads(manifest.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        salida.append(
            {
                "slug": carpeta.name,
                "nombre": m.get("nombre", carpeta.name),
                "codigo": m.get("codigo"),
                "categoria": m.get("categoria"),
                "n_items": m.get("n_items"),
                "tipo_respuesta": m.get("tipo_respuesta"),
                "estado": m.get("estado", ""),
                "tomable": (carpeta / "preguntas.json").exists(),
                # `disponible` False = test en preparación: no se puede asignar a empresas.
                "disponible": bool(m.get("disponible", True)),
            }
        )
    return salida


def slugs_catalogo() -> set[str]:
    """Conjunto de slugs válidos del catálogo."""
    return {t["slug"] for t in listar_catalogo()}
