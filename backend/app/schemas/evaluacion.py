"""Esquemas del módulo de Evaluaciones (formularios: competencias → preguntas)."""
from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, EmailStr

from app.models.evaluacion import (
    ESCALA_LIKERT,
    ESCALA_SATISFACCION,
    ESCALA_SINO,
    TIPO_360,
    TIPO_AREAS,
    TIPO_CLIENTES,
    TIPO_PROCESOS,
)

TIPOS_VALIDOS = {TIPO_360, TIPO_AREAS, TIPO_PROCESOS, TIPO_CLIENTES}
ESCALAS_VALIDAS = {ESCALA_LIKERT, ESCALA_SINO, ESCALA_SATISFACCION}
RELACIONES_360 = {"auto", "supervisor", "par", "reporte"}
RELACION_OBSERVADOR = "observador"
RELACION_CLIENTE = "cliente"


class PreguntaIn(BaseModel):
    texto: str
    orden: int = 0


class CompetenciaIn(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    orden: int = 0
    preguntas: List[PreguntaIn] = []


class FormularioIn(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    tipo: str = TIPO_360
    escala: str = ESCALA_LIKERT
    competencias: List[CompetenciaIn] = []


# ── Campañas ──────────────────────────────────────────────────────────────────
class EvaluadorIn(BaseModel):
    relacion: str  # 360: auto|supervisor|par|reporte · áreas/procesos: observador
    nombre: str
    email: EmailStr
    evaluado_id: Optional[str] = None


class CampaniaIn(BaseModel):
    nombre: str
    formulario_id: str
    sujeto_nombre: str
    sujeto_evaluado_id: Optional[str] = None
    anonimato_min: int = 3
    evaluadores: List[EvaluadorIn] = []


class CampaniaPatch(BaseModel):
    nombre: Optional[str] = None
    anonimato_min: Optional[int] = None


class RespuestaPublicaIn(BaseModel):
    respuestas: Dict[str, int]  # {pregunta_id: valor}
