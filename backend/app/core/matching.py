"""Motor de matching candidato↔vacante — puerto fiel de calcularCoincidenciaVacante()
del Codigo.gs legacy de ONE Talent Hub (apps-script/Codigo.gs, línea ~1636).

Mismas reglas, mismos puntajes que el original: comparación por tokens (sin IA/embeddings),
0-100. MATCH_MINIMO_NOTIFICACION y MAX_NOTIFICACIONES_DIARIAS_POSTULANTE con los mismos
valores que el legacy (55 y 3) — ver Codigo.gs líneas 46-47.
"""
from __future__ import annotations

import datetime as dt
import logging
import re
import unicodedata
import uuid
from dataclasses import dataclass, field
from typing import Any, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import apply_rls_context, engine
from app.core.email import enviar_notificacion_vacante
from app.models.notificacion_vacante import NotificacionVacante
from app.models.persona import Persona
from app.models.tenant import Empresa
from app.models.vacante import Vacante

logger = logging.getLogger("app.matching")

MATCH_MINIMO_NOTIFICACION = 55
MAX_NOTIFICACIONES_DIARIAS_POSTULANTE = 3

_STOPWORDS = {
    "de", "del", "la", "el", "los", "las", "y", "en",
    "para", "con", "sin", "por", "un", "una", "al",
}


@dataclass
class ResultadoMatch:
    puntaje: int
    motivos: list[str] = field(default_factory=list)
    detalles: list[str] = field(default_factory=list)
    claves: list[str] = field(default_factory=list)


def _normalizar(v: Optional[str]) -> str:
    """Minúsculas, sin acentos, sin puntuación — igual que normalizarTextoMatch()."""
    txt = (v or "").strip()
    if not txt:
        return ""
    txt = txt.lower()
    txt = unicodedata.normalize("NFD", txt)
    txt = "".join(c for c in txt if unicodedata.category(c) != "Mn")
    txt = re.sub(r"[^a-z0-9\s]", " ", txt)
    return re.sub(r"\s+", " ", txt).strip()


def _tokens(v: Optional[str]) -> list[str]:
    """Igual que tokensMatch(): palabras >=3 chars, sin stopwords, sin duplicados, en orden."""
    txt = _normalizar(v)
    if not txt:
        return []
    out: list[str] = []
    for t in txt.split(" "):
        if len(t) >= 3 and t not in _STOPWORDS and t not in out:
            out.append(t)
    return out


def _interseccion(a: list[str], b: list[str]) -> list[str]:
    set_b = set(b)
    return [x for x in a if x in set_b]


def _texto_desde_lista(valor: Any) -> str:
    """Igual que textoDesdeJSON(): aplana una lista de dicts/strings a un solo texto."""
    if not valor:
        return ""
    if isinstance(valor, str):
        return valor
    if not isinstance(valor, list):
        valor = [valor]
    partes: list[str] = []
    for item in valor:
        if not item:
            continue
        if isinstance(item, str):
            partes.append(item)
        elif isinstance(item, dict):
            for v in item.values():
                if v is not None and not isinstance(v, (dict, list)):
                    partes.append(str(v))
    return " ".join(partes)


def _nivel_idioma_valor(nivel: Optional[str]) -> int:
    n = _normalizar(nivel)
    if not n:
        return 0
    if "nativo" in n or "bilingue" in n:
        return 4
    if "avanzado" in n:
        return 3
    if "intermedio" in n:
        return 2
    if "basico" in n:
        return 1
    return 0


def _nivel_idioma_persona(idiomas: Optional[list], idioma_buscado: Optional[str]) -> str:
    buscado = _normalizar(idioma_buscado)
    if not isinstance(idiomas, list):
        return ""
    for item in idiomas:
        if not isinstance(item, dict):
            continue
        idioma = _normalizar(item.get("idioma") or item.get("Idioma"))
        if buscado and buscado in idioma:
            return item.get("nivel") or item.get("Nivel") or ""
    return ""


def _anios_requeridos(vacante: Vacante) -> int:
    texto = _normalizar(
        " ".join(filter(None, [vacante.requisitos_excluyentes, vacante.requisitos_deseables, vacante.descripcion]))
    )
    m = re.search(r"(\d+)\s*(anios|anos|years)", texto)
    return int(m.group(1)) if m else 0


def _sumar_motivo(motivos: list[str], texto: str, detalle: str = "") -> str:
    if texto not in motivos:
        motivos.append(texto)
    return f"{texto}: {detalle}" if detalle else texto


def calcular_match(persona: Persona, vacante: Vacante) -> ResultadoMatch:
    """Puntaje 0-100 de compatibilidad entre una Persona y una Vacante. Determinista, sin IA."""
    puntaje = 0
    motivos: list[str] = []
    detalles: list[str] = []
    claves: list[str] = []

    # Puesto deseado vs puesto/área de la vacante — hasta 32 pts.
    tokens_puesto = _interseccion(
        _tokens(persona.puesto_deseado),
        _tokens(f"{vacante.puesto or ''} {vacante.area or ''}"),
    )
    if tokens_puesto:
        puntaje += min(32, 18 + len(tokens_puesto) * 7)
        detalles.append(_sumar_motivo(motivos, "Puesto relacionado", ", ".join(tokens_puesto[:4])))
        claves += tokens_puesto

    # Ubicación: remoto +12, o provincia +14 / localidad +8.
    provincia_persona = _normalizar(persona.provincia)
    provincia_vac = _normalizar(vacante.provincia)
    localidad_persona = _normalizar(persona.codigo_postal_ciudad)
    localidad_vac = _normalizar(vacante.localidad)
    modalidad_vac = _normalizar(vacante.modalidad)
    if "remoto" in modalidad_vac:
        puntaje += 12
        detalles.append(_sumar_motivo(motivos, "Modalidad remota", "apta para perfiles de distintas localidades"))
    else:
        if provincia_persona and provincia_vac and provincia_vac in provincia_persona:
            puntaje += 14
            detalles.append(_sumar_motivo(motivos, "Coincide provincia", vacante.provincia or ""))
        if localidad_persona and localidad_vac and localidad_vac in localidad_persona:
            puntaje += 8
            detalles.append(_sumar_motivo(motivos, "Coincide localidad", vacante.localidad or ""))

    # Habilidades / experiencia — hasta 24 pts.
    habilidades_vac = _tokens(
        f"{vacante.habilidades or ''} {vacante.requisitos_excluyentes or ''} {vacante.requisitos_deseables or ''}"
    )
    texto_persona = " ".join(filter(None, [
        persona.puesto_deseado,
        persona.perfil_profesional,
        persona.descripcion_perfil,
        _texto_desde_lista(persona.experiencias),
        _texto_desde_lista(persona.formacion),
        _texto_desde_lista(persona.idiomas),
    ]))
    habilidades_match = _interseccion(_tokens(texto_persona), habilidades_vac)
    if habilidades_match:
        puntaje += min(24, len(habilidades_match) * 6)
        detalles.append(_sumar_motivo(motivos, "Coinciden habilidades o experiencia", ", ".join(habilidades_match[:6])))
        claves += habilidades_match

    # Formación relacionada con los requisitos — +10 pts.
    tokens_formacion = _interseccion(
        _tokens(_texto_desde_lista(persona.formacion)),
        _tokens(f"{vacante.requisitos_excluyentes or ''} {vacante.requisitos_deseables or ''}"),
    )
    if tokens_formacion:
        puntaje += 10
        detalles.append(_sumar_motivo(motivos, "Formación relacionada", ", ".join(tokens_formacion[:4])))
        claves += tokens_formacion

    # Idioma requerido — +10 si el nivel alcanza, +4 si no alcanza pero lo tiene cargado.
    idioma_vac = _normalizar(vacante.idioma_requerido)
    idiomas_persona_txt = _normalizar(_texto_desde_lista(persona.idiomas))
    if idioma_vac and idioma_vac != "sin requisito de idioma" and idioma_vac in idiomas_persona_txt:
        nivel_persona = _nivel_idioma_persona(persona.idiomas, vacante.idioma_requerido)
        valor_persona = _nivel_idioma_valor(nivel_persona)
        valor_req = _nivel_idioma_valor(vacante.nivel_idioma)
        if not valor_req or valor_persona >= valor_req:
            puntaje += 10
            detalles.append(_sumar_motivo(
                motivos, "Coincide idioma",
                " ".join(filter(None, [vacante.idioma_requerido, nivel_persona])),
            ))
        else:
            puntaje += 4
            detalles.append(_sumar_motivo(
                motivos, "Idioma relacionado",
                " ".join(filter(None, [vacante.idioma_requerido, f"nivel del perfil: {nivel_persona}"])),
            ))

    # Experiencia: penaliza si la vacante pide años y el postulante marcó "primer empleo"; si no, +6.
    exp_texto = _normalizar(_texto_desde_lista(persona.experiencias))
    anios_req = _anios_requeridos(vacante)
    if anios_req > 0 and persona.primer_empleo:
        puntaje -= min(18, anios_req * 4)
        detalles.append(_sumar_motivo(
            motivos, "Revisar experiencia requerida",
            f"la vacante pide {anios_req} año(s) y el perfil indica primer empleo",
        ))
    elif exp_texto:
        puntaje += 6
        detalles.append(_sumar_motivo(motivos, "Tiene experiencia cargada", "tu perfil incluye antecedentes laborales"))

    claves_unicas: list[str] = []
    for k in claves:
        if k and k not in claves_unicas:
            claves_unicas.append(k)

    return ResultadoMatch(
        puntaje=max(0, min(100, puntaje)),
        motivos=motivos,
        detalles=detalles,
        claves=claves_unicas[:8],
    )


async def notificar_postulantes_compatibles(vacante_id: uuid.UUID) -> int:
    """Corre el motor contra TODA la base de candidatos y notifica por email a los que
    superan MATCH_MINIMO_NOTIFICACION (tope MAX_NOTIFICACIONES_DIARIAS_POSTULANTE/día).
    Se llama en background cuando una Vacante pasa a 'activa' (ver routes/vacantes.py).

    Corre en una sesión propia con contexto elevado (is_superadmin) — es la única forma
    correcta de que el motor vea candidatos fuera del tenant de la vacante a propósito,
    sin aflojar la RLS del resto de la app (ver migración b2c3d4e5f6a7 y la nota en
    app/models/persona.py sobre por qué Persona necesita este bypass acotado).
    """
    enviados = 0
    async with AsyncSession(engine) as db:
        await apply_rls_context(db, is_superadmin=True)

        vacante = await db.get(Vacante, vacante_id)
        if vacante is None or vacante.estado != "activa":
            return 0
        empresa = await db.get(Empresa, vacante.tenant_id)

        ya_notificados = set(
            (
                await db.execute(
                    select(NotificacionVacante.persona_id).where(NotificacionVacante.vacante_id == vacante_id)
                )
            )
            .scalars()
            .all()
        )
        hoy = dt.datetime.now(dt.timezone.utc).date()
        conteo_hoy = dict(
            (
                await db.execute(
                    select(NotificacionVacante.persona_id, func.count())
                    .where(func.date(NotificacionVacante.created_at) == hoy)
                    .group_by(NotificacionVacante.persona_id)
                )
            ).all()
        )
        personas = (await db.execute(select(Persona).where(Persona.activo.is_(True)))).scalars().all()

        marca = {
            "razon_social": empresa.razon_social,
            "color_acento": empresa.color_acento,
            "color_secundario": empresa.color_secundario,
            "logo_url": empresa.logo_url,
        } if empresa else {}
        link_vacante = f"{settings.PUBLIC_BASE_URL.rstrip('/')}/busquedas/{vacante.id}"

        for persona in personas:
            if persona.id in ya_notificados or conteo_hoy.get(persona.id, 0) >= MAX_NOTIFICACIONES_DIARIAS_POSTULANTE:
                continue
            resultado = calcular_match(persona, vacante)
            if resultado.puntaje < MATCH_MINIMO_NOTIFICACION:
                continue

            enviado = await enviar_notificacion_vacante(marca, persona.nombre, persona.email, vacante.puesto, link_vacante)
            db.add(
                NotificacionVacante(
                    tenant_id=vacante.tenant_id,
                    vacante_id=vacante.id,
                    persona_id=persona.id,
                    puntaje=resultado.puntaje,
                    motivos=", ".join(resultado.motivos) or None,
                    estado="enviado" if enviado else ("omitido" if not settings.email_habilitado else "error"),
                )
            )
            enviados += 1

        await db.commit()
    logger.info("Matching vacante %s: %d candidatos notificados", vacante_id, enviados)
    return enviados
