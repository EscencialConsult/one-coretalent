"""Registro público de empresa (auto-registro con verificación — flujo de Talent Hub)."""
from __future__ import annotations

import base64
import binascii
import re

from pydantic import BaseModel, EmailStr, Field, field_validator

_SUBDOMINIO_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$")
_IMAGEN_MAX_BYTES = 5 * 1024 * 1024


def _decodificar_base64(valor: str, nombre: str) -> bytes:
    try:
        return base64.b64decode(valor, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError(f"El archivo de {nombre} no contiene base64 válido.") from exc


def _validar_imagen(valor: str, nombre: str) -> str:
    contenido = _decodificar_base64(valor, nombre)
    if len(contenido) > _IMAGEN_MAX_BYTES:
        raise ValueError(f"La imagen de {nombre} no puede superar los 5 MB.")
    es_jpeg = contenido.startswith(b"\xff\xd8\xff")
    es_png = contenido.startswith(b"\x89PNG\r\n\x1a\n")
    es_webp = contenido[:4] == b"RIFF" and contenido[8:12] == b"WEBP"
    if not (es_jpeg or es_png or es_webp):
        raise ValueError(f"La imagen de {nombre} debe ser JPEG, PNG o WEBP.")
    return valor


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
    # Las 3 fotos son obligatorias (selfie + ambas caras del DNI): sin esto no hay forma de que
    # un humano revise de verdad la identidad antes de aprobar la cuenta (ver auditoría 2026-09-01).
    selfie_base64: str
    firma_legal_base64: str
    dni_frente_base64: str
    dni_dorso_base64: str

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

    @field_validator("selfie_base64")
    @classmethod
    def _validar_selfie(cls, v: str) -> str:
        return _validar_imagen(v, "la selfie")

    @field_validator("firma_legal_base64")
    @classmethod
    def _validar_firma(cls, v: str) -> str:
        return _validar_imagen(v, "la firma")

    @field_validator("dni_frente_base64", "dni_dorso_base64")
    @classmethod
    def _validar_dni_foto(cls, v: str) -> str:
        return _validar_imagen(v, "el DNI")


class RegistroCandidatoIn(BaseModel):
    nombre: str = Field(min_length=2, max_length=120)
    apellido: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    acepto_terminos: bool

    @field_validator("nombre", "apellido")
    @classmethod
    def limpiar_nombre(cls, valor: str) -> str:
        return " ".join(valor.strip().split())

    @field_validator("acepto_terminos")
    @classmethod
    def exigir_terminos(cls, valor: bool) -> bool:
        if not valor:
            raise ValueError("Debés aceptar los términos y la política de privacidad.")
        return valor
