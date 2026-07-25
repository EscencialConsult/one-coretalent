from __future__ import annotations

import datetime as dt
import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class PersonaPerfilOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    nombre: str
    apellido: str
    telefono: str | None
    puesto_deseado: str | None
    fecha_nacimiento: str | None
    identificacion: str | None
    provincia: str | None
    codigo_postal_ciudad: str | None
    perfil_profesional: str | None
    descripcion_perfil: str | None
    formacion: list
    idiomas: list
    experiencias: list
    disp_viajar: bool
    disp_cambio_residencia: bool
    primer_empleo: bool
    cv_nombre: str | None
    cv_url: str | None


class PersonaPerfilUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nombre: str = Field(min_length=1, max_length=120)
    apellido: str = Field(min_length=1, max_length=120)
    telefono: str | None = Field(default=None, max_length=40)
    puesto_deseado: str | None = Field(default=None, max_length=160)
    fecha_nacimiento: str | None = Field(default=None, max_length=20)
    identificacion: str | None = Field(default=None, max_length=40)
    provincia: str | None = Field(default=None, max_length=120)
    codigo_postal_ciudad: str | None = Field(default=None, max_length=120)
    perfil_profesional: str | None = Field(default=None, max_length=160)
    descripcion_perfil: str | None = None
    formacion: list[dict[str, Any]] = Field(default_factory=list)
    idiomas: list[dict[str, Any]] = Field(default_factory=list)
    experiencias: list[dict[str, Any]] = Field(default_factory=list)
    disp_viajar: bool = False
    disp_cambio_residencia: bool = False
    primer_empleo: bool = False


class PersonaCvIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nombre: str = Field(min_length=1, max_length=255)
    base64: str


class PersonaPasswordIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    password_actual: str
    password_nueva: str = Field(min_length=8, max_length=128)


class PostulacionPersonaResumenOut(BaseModel):
    id: uuid.UUID
    vacante_id: uuid.UUID
    puesto: str
    empresa: str
    estado_vacante: str
    created_at: dt.datetime
    evaluaciones_total: int
    evaluaciones_pendientes: int
    evaluaciones_completadas: int


class PostulacionPersonaDetalleOut(PostulacionPersonaResumenOut):
    descripcion: str | None
    modalidad: str | None
    provincia: str | None
    localidad: str | None
    respuestas_busqueda: dict | None
    consentimiento_firmado_at: dt.datetime | None
    conformidad_firmada_at: dt.datetime | None


class ConsentimientoOut(BaseModel):
    postulacion_id: uuid.UUID
    vacante: str
    empresa: str
    consentimiento_firmado_at: dt.datetime | None
    conformidad_firmada_at: dt.datetime | None
    evaluaciones: int
