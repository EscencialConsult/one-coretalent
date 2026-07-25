"""Esquemas de Vacante — panel de empresa y listado público."""
from __future__ import annotations

import datetime as dt
import uuid
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

_ESTADOS_VALIDOS = {"borrador", "activa", "pausada", "cerrada"}


class VacanteCreate(BaseModel):
    puesto: str
    descripcion: Optional[str] = None
    provincia: Optional[str] = None
    localidad: Optional[str] = None
    modalidad: Optional[str] = None
    jornada: Optional[str] = None
    vacantes: int = 1
    area: Optional[str] = None
    tipo_contrato: Optional[str] = None
    zona: Optional[str] = None
    responsabilidades: Optional[str] = None
    requisitos_excluyentes: Optional[str] = None
    requisitos_deseables: Optional[str] = None
    habilidades: Optional[str] = None
    idioma_requerido: Optional[str] = None
    nivel_idioma: Optional[str] = None
    salario_min: Optional[float] = None
    salario_max: Optional[float] = None
    ocultar_salario: bool = False
    horario: Optional[str] = None
    beneficios: Optional[str] = None
    beneficios_otros: Optional[str] = None
    fecha_vencimiento: Optional[dt.datetime] = None
    reclutador: Optional[str] = None
    pregunta_1: Optional[str] = None
    pregunta_2: Optional[str] = None


class VacanteUpdate(VacanteCreate):
    puesto: Optional[str] = None  # type: ignore[assignment]
    vacantes: Optional[int] = None  # type: ignore[assignment]


class VacanteEstadoIn(BaseModel):
    estado: str = Field(description="borrador | activa | pausada | cerrada")


class VacanteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    puesto: str
    descripcion: Optional[str] = None
    provincia: Optional[str] = None
    localidad: Optional[str] = None
    modalidad: Optional[str] = None
    jornada: Optional[str] = None
    vacantes: int
    estado: str
    area: Optional[str] = None
    tipo_contrato: Optional[str] = None
    zona: Optional[str] = None
    responsabilidades: Optional[str] = None
    requisitos_excluyentes: Optional[str] = None
    requisitos_deseables: Optional[str] = None
    habilidades: Optional[str] = None
    idioma_requerido: Optional[str] = None
    nivel_idioma: Optional[str] = None
    salario_min: Optional[float] = None
    salario_max: Optional[float] = None
    ocultar_salario: bool
    horario: Optional[str] = None
    beneficios: Optional[str] = None
    beneficios_otros: Optional[str] = None
    fecha_vencimiento: Optional[dt.datetime] = None
    reclutador: Optional[str] = None
    pregunta_1: Optional[str] = None
    pregunta_2: Optional[str] = None
    created_at: dt.datetime


class VacantePublicaOut(BaseModel):
    """Lo que ve un candidato sin login — sin datos internos (reclutador, notas, etc.)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    empresa: Optional[str] = None
    puesto: str
    descripcion: Optional[str] = None
    provincia: Optional[str] = None
    localidad: Optional[str] = None
    modalidad: Optional[str] = None
    jornada: Optional[str] = None
    area: Optional[str] = None
    tipo_contrato: Optional[str] = None
    requisitos_excluyentes: Optional[str] = None
    requisitos_deseables: Optional[str] = None
    habilidades: Optional[str] = None
    idioma_requerido: Optional[str] = None
    nivel_idioma: Optional[str] = None
    salario_min: Optional[float] = None
    salario_max: Optional[float] = None
    ocultar_salario: bool
    horario: Optional[str] = None
    beneficios: Optional[str] = None
    pregunta_1: Optional[str] = None
    pregunta_2: Optional[str] = None
    created_at: dt.datetime
