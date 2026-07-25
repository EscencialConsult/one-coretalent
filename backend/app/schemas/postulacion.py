"""Esquemas de Postulación pública (formulario del candidato) y su vista para la empresa."""
from __future__ import annotations

import base64
import binascii
import datetime as dt
import uuid
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


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

    @field_validator("cv_base64")
    @classmethod
    def validar_cv(cls, valor: Optional[str]) -> Optional[str]:
        if valor is None:
            return None
        contenido = _decodificar_base64(valor, "CV")
        if len(contenido) > 5 * 1024 * 1024:
            raise ValueError("El CV no puede superar los 5 MB.")
        if not contenido.startswith(b"%PDF-"):
            raise ValueError("El CV debe ser un archivo PDF válido.")
        return valor

    @field_validator("firma_consentimiento_base64", "firma_conformidad_base64")
    @classmethod
    def validar_firma(cls, valor: Optional[str]) -> Optional[str]:
        if valor is None:
            return None
        contenido = _decodificar_base64(valor, "firma")
        if len(contenido) > 2 * 1024 * 1024:
            raise ValueError("La firma no puede superar los 2 MB.")
        if not contenido.startswith(b"\x89PNG\r\n\x1a\n"):
            raise ValueError("La firma debe ser una imagen PNG válida.")
        return valor


def _decodificar_base64(valor: str, nombre: str) -> bytes:
    try:
        return base64.b64decode(valor, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError(f"El archivo de {nombre} no contiene base64 válido.") from exc


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


class PostulacionResumenOut(BaseModel):
    """Vista consolidada de todas las postulaciones de la empresa (todas las vacantes)."""
    id: uuid.UUID
    persona_id: uuid.UUID
    vacante_id: uuid.UUID
    nombre: str
    apellido: str
    email: str
    telefono: Optional[str] = None
    perfil_profesional: Optional[str] = None
    cv_url: Optional[str] = None
    vacante_puesto: str
    created_at: dt.datetime
