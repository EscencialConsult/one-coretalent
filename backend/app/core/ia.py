"""Generación de informes gerenciales integrales con IA (OpenAI).

Regla de oro (no negociable): la IA SOLO redacta e integra. Recibe los resultados
YA CALCULADOS de cada test (deterministas) y los trata como HECHOS INMODIFICABLES:
no recalcula, no cambia tipos/niveles/puntajes, no inventa datos. Si dos tests
parecen contradecirse, lo señala como observación, sin "corregir" ningún resultado.

Además, el informe se ADAPTA a dos cosas:
- La NATURALEZA de cada prueba (categoría): usa la terminología correcta (una prueba
  de Excel es de "conocimiento", no "psicométrica").
- El TIPO de evaluado: `colaborador` → informe de DESARROLLO (áreas a mejorar +
  recomendaciones de acción para gerencia); `postulante` → informe de SELECCIÓN
  (cómo predomina el perfil + aspectos a considerar + ajuste al puesto, SIN plan de
  desarrollo, porque no es un empleado a desarrollar sino un candidato a decidir).
"""
from __future__ import annotations

import asyncio
import json
import logging

from app.core.config import settings

logger = logging.getLogger("app.ia")

# Cómo nombrar cada prueba según su categoría (del manifest del catálogo).
_TERMINOLOGIA = {
    "conocimiento": "prueba de conocimiento / técnica (mide dominio de una herramienta o tema; NO es psicométrica)",
    "personalidad": "prueba de personalidad",
    "inteligencia_emocional": "prueba de inteligencia emocional",
    "inteligencia": "prueba de inteligencia / aptitud cognitiva",
    "aptitudes": "prueba de aptitudes",
    "psicotecnico": "prueba psicotécnica",
    "atencion_percepcion": "prueba de atención y percepción",
    "intereses_vocacionales": "prueba de intereses vocacionales",
    "orientacion_vocacional": "prueba de orientación vocacional",
    "vocacional": "prueba vocacional",
    "liderazgo": "evaluación de liderazgo",
    "competencias-comerciales": "evaluación de competencias comerciales",
    "clinica": "cuestionario clínico",
    "bienestar": "cuestionario de bienestar",
}


def _naturaleza(categoria: str | None) -> str:
    return _TERMINOLOGIA.get((categoria or "").strip().lower(), "prueba de evaluación")


_REGLAS_BASE = (
    "REGLAS ABSOLUTAS (obligatorias):\n"
    "1. Los resultados de cada prueba ya están CALCULADOS y son HECHOS. NO los modifiques, "
    "NO los recalcules, NO cambies ningún tipo, eneatipo, dimensión, nivel, categoría, puntaje "
    "ni porcentaje. Ejemplo: si el eneagrama dice eneatipo 5 y 3, en tu informe sigue siendo 5 y 3.\n"
    "2. NO inventes datos, puntajes ni resultados que no estén en la información provista.\n"
    "3. USÁ LA TERMINOLOGÍA CORRECTA de cada prueba según su naturaleza (te la indico en cada "
    "bloque). NUNCA llames 'psicométrica' a una prueba de conocimiento/técnica, ni generalices "
    "el tipo de todas las pruebas.\n"
    "4. INTEGRACIÓN: redactá una sección de integración SOLO si hay 2 o más pruebas de "
    "NATURALEZA DISTINTA que realmente se crucen. Si todas las pruebas son del mismo tipo (por "
    "ejemplo, niveles de una misma habilidad), NO hables de 'tensiones': describí consistencia o "
    "progresión y poné un título acorde en 'integracion_titulo'. Si hay una sola prueba, dejá "
    "'integracion' e 'integracion_titulo' en null.\n"
    "5. Basá TODO exclusivamente en los datos provistos. No uses conocimiento externo sobre la persona.\n"
    "6. Devolvé ÚNICAMENTE un JSON válido (sin texto fuera del JSON), con la forma exacta indicada abajo.\n"
)

_MODO_DESARROLLO = (
    "CONTEXTO: la persona es un COLABORADOR (empleado) de la empresa. El informe es de "
    "DESARROLLO: su objetivo es que la gerencia/RRHH pueda potenciar y desarrollar a la persona. "
    "Incluí áreas de desarrollo y recomendaciones accionables (capacitación, coaching, plan de mejora).\n\n"
    "Forma EXACTA del JSON:\n"
    + json.dumps(
        {
            "titulo": "string",
            "modo": "desarrollo",
            "resumen_ejecutivo": "string (2-4 párrafos)",
            "perfil_por_test": [
                {"test": "nombre de la prueba", "sintesis": "qué dice esa prueba, respetando literalmente sus resultados"}
            ],
            "integracion_titulo": "string o null (título acorde al contenido; null si no aplica)",
            "integracion": "string o null (coherencias/tensiones o consistencia entre pruebas; null si no aplica)",
            "fortalezas": ["string"],
            "areas_desarrollo": ["string"],
            "recomendaciones": ["string: acción concreta para gerencia/RRHH"],
            "cierre": "string: párrafo de cierre ejecutivo",
        },
        ensure_ascii=False,
        indent=2,
    )
)

_MODO_SELECCION = (
    "CONTEXTO: la persona es un POSTULANTE (candidato) a una búsqueda laboral. El informe es de "
    "SELECCIÓN: su objetivo es ayudar a la gerencia a DECIDIR en el proceso, describiendo cómo "
    "PREDOMINA el perfil según las pruebas realizadas. NO des recomendaciones de desarrollo, "
    "capacitación ni planes de mejora para la persona (no es un empleado a desarrollar, es un "
    "candidato a evaluar). En vez de 'áreas de desarrollo', señalá 'aspectos a considerar' de "
    "forma NEUTRAL y objetiva para la decisión. En vez de recomendaciones de mejora, dá una "
    "orientación para el proceso de selección (ajuste al perfil buscado, temas a profundizar en "
    "una entrevista). El foco es informar el perfil, no corregir a la persona.\n\n"
    "Forma EXACTA del JSON:\n"
    + json.dumps(
        {
            "titulo": "string",
            "modo": "seleccion",
            "resumen_ejecutivo": "string (2-4 párrafos: perfil del candidato según las pruebas)",
            "perfil_por_test": [
                {"test": "nombre de la prueba", "sintesis": "cómo predomina el perfil según esa prueba, respetando literalmente sus resultados"}
            ],
            "integracion_titulo": "string o null",
            "integracion": "string o null (perfil integrado que surge al cruzar las pruebas; null si no aplica)",
            "fortalezas": ["string: aspectos destacados / a favor para el puesto"],
            "aspectos_a_considerar": ["string: neutral, para la decisión (NO redactar como 'a mejorar')"],
            "ajuste_al_perfil": ["string: orientación para la selección (ajuste al perfil, temas a profundizar en entrevista)"],
            "cierre": "string: párrafo de cierre ejecutivo orientado a la decisión",
        },
        ensure_ascii=False,
        indent=2,
    )
)


def _system(modo: str) -> str:
    cabecera = (
        "Sos un analista senior de Recursos Humanos. Redactás un INFORME GERENCIAL INTEGRAL en "
        "español rioplatense, con tono ejecutivo, claro y profesional, para presentar a la gerencia "
        "de una empresa. Integrás los resultados de varias pruebas que rindió UNA misma persona.\n\n"
    )
    return cabecera + _REGLAS_BASE + "\n" + (_MODO_SELECCION if modo == "seleccion" else _MODO_DESARROLLO)


def _construir_prompt(evaluado: str, empresa: str, tests: list[dict], modo: str) -> str:
    """Arma el mensaje de usuario con los resultados deterministas y la naturaleza de cada prueba."""
    tipo_txt = "POSTULANTE (candidato en un proceso de selección)" if modo == "seleccion" else "COLABORADOR (empleado de la empresa)"
    partes = [
        f"Persona evaluada: {evaluado}",
        f"Empresa: {empresa}",
        f"Tipo de evaluado: {tipo_txt}",
        f"Cantidad de pruebas a integrar: {len(tests)}",
        "",
        "A continuación, los RESULTADOS YA CALCULADOS de cada prueba (hechos inmodificables). "
        "Cada bloque indica el nombre de la prueba, su NATURALEZA (usá esa terminología) y su salida en JSON:",
        "",
    ]
    for t in tests:
        nat = _naturaleza(t.get("categoria"))
        partes.append(f"=== PRUEBA: {t['nombre']} — naturaleza: {nat} (categoría: {t.get('categoria') or 'n/d'}) ===")
        partes.append(json.dumps(t["datos"], ensure_ascii=False))
        partes.append("")
    partes.append(
        "Redactá el informe gerencial integral respetando literalmente todos los resultados anteriores "
        "y el contexto indicado. Devolvé solo el JSON con la forma exacta pedida."
    )
    return "\n".join(partes)


def _generar_sync(evaluado: str, empresa: str, tests: list[dict], modo: str) -> dict:
    from openai import OpenAI

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    resp = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": _system(modo)},
            {"role": "user", "content": _construir_prompt(evaluado, empresa, tests, modo)},
        ],
        response_format={"type": "json_object"},
        temperature=0.4,
        max_tokens=settings.OPENAI_MAX_TOKENS,
    )
    contenido = resp.choices[0].message.content or "{}"
    data = json.loads(contenido)
    if not isinstance(data, dict):
        raise ValueError("La IA no devolvió un objeto JSON válido")
    return data


async def generar_informe_integral(
    evaluado: str, empresa: str, tests: list[dict], tipo_evaluado: str = "colaborador"
) -> dict:
    """Genera el informe integral. Lanza excepción si la IA no está configurada o falla.

    tests: [{"nombre": str, "categoria": str|None, "datos": dict}] — datos = salida determinista.
    tipo_evaluado: "colaborador" → informe de desarrollo; "postulante" → informe de selección.
    """
    if not settings.ia_habilitada:
        raise RuntimeError("La IA no está configurada (falta OPENAI_API_KEY).")
    if not tests:
        raise ValueError("No hay tests para integrar.")
    modo = "seleccion" if (tipo_evaluado or "").strip().lower() == "postulante" else "desarrollo"
    data = await asyncio.to_thread(_generar_sync, evaluado, empresa, tests, modo)
    data.setdefault("modo", modo)  # garantiza el campo aunque la IA lo omita
    logger.info("Informe integral generado para %s (%d pruebas, modo=%s)", evaluado, len(tests), modo)
    return data
