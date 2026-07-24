"""Registro público de empresa (auto-registro con verificación — flujo de Talent Hub)."""
from __future__ import annotations

import re

from pydantic import BaseModel, EmailStr, Field, field_validator

_SUBDOMINIO_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$")


class RegistroEmpresaIn(BaseModel):
    razon_social: str
    subdominio: str
    email_admin: EmailStr
    admin_password: str = Field(min_length=8)
    admin_nombre: str
    admin_apellido: str = ""

    cuit: str
    rubro: str | None = None
    dni: str

    acepto_terminos: bool

    # Verificación de identidad del representante — en base64, se suben a Storage server-side.
    selfie_base64: str
    firma_legal_base64: str
    dni_frente_base64: str | None = None
    dni_dorso_base64: str | None = None

    @field_validator("subdominio")
    @classmethod
    def _validar_subdominio(cls, v: str) -> str:
        v = v.strip().lower()
        if not _SUBDOMINIO_RE.match(v):
            raise ValueError("Subdominio inválido: usar solo minúsculas, números y guiones.")
        return v

    @field_validator("dni")
    @classmethod
    def _validar_dni(cls, v: str) -> str:
        digitos = re.sub(r"[^0-9]", "", v)
        if len(digitos) != 8:
            raise ValueError("El DNI debe tener 8 dígitos.")
        return digitos

    @field_validator("acepto_terminos")
    @classmethod
    def _debe_aceptar(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Hay que aceptar los términos y condiciones para registrarse.")
        return v
