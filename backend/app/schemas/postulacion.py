"""Esquemas de Postulación pública (formulario del candidato) y su vista para la empresa."""
from __future__ import annotations

import datetime as dt
import uuid
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class PostulacionIn(BaseModel):
    vacante_id: uuid.UUID

    # Datos de Persona — se crea o actualiza por email (identidad global, ver models/persona.py).
    email: EmailStr
    nombre: str
    apellido: str
    telefono: Optional[str] = None
    puesto_deseado: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    identificacion: Optional[str] = None
    provincia: Optional[str] = None
    codigo_postal_ciudad: Optional[str] = None
    perfil_profesional: Optional[str] = None
    formacion: Optional[list] = None
    descripcion_perfil: Optional[str] = None
    disp_viajar: bool = False
    disp_cambio_residencia: bool = False
    idiomas: Optional[list] = None
    primer_empleo: bool = False
    experiencias: Optional[list] = None
    # Opcional: si la manda, deja la cuenta lista para el login self-service (/auth/persona/login).
    password: Optional[str] = Field(default=None, min_length=8)

    # Archivos en base64 (mismo criterio que el registro de empresa) — se suben a Supabase
    # Storage server-side, nunca quedan como base64 en la base.
    cv_base64: Optional[str] = None
    cv_nombre: Optional[str] = None
    firma_consentimiento_base64: Optional[str] = None
    firma_conformidad_base64: Optional[str] = None

    # Respuestas a Vacante.pregunta_1 / pregunta_2, si la vacante las pedía.
    respuesta_pregunta_1: Optional[str] = None
    respuesta_pregunta_2: Optional[str] = None


class PostulacionOut(BaseModel):
    id: uuid.UUID
    persona_id: uuid.UUID
    vacante_id: uuid.UUID
    nombre: str
    apellido: str
    email: str
    telefono: Optional[str] = None
    perfil_profesional: Optional[str] = None
    cv_url: Optional[str] = None
    respuestas_busqueda: Optional[dict] = None
    created_at: dt.datetime
