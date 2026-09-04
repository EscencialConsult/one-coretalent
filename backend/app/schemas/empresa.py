"""Esquemas de Empresa (tenant) para el panel SuperAdmin."""
from __future__ import annotations

import datetime as dt
import re
import uuid
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.models.enums import EstadoEmpresa

_SUBDOMINIO_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$")


class EmpresaCreate(BaseModel):
    razon_social: str
    subdominio: str
    email_admin: EmailStr
    color_acento: str = "#4d248f"
    color_secundario: str = "#6be1e3"
    logo_url: Optional[str] = None  # URL externa o data URI base64
    # Admin principal de la empresa (opcional al crear). Si se envía password, se crea el usuario.
    admin_password: Optional[str] = None
    admin_nombre: str = "Administrador"
    admin_apellido: str = ""

    @field_validator("subdominio")
    @classmethod
    def _validar_subdominio(cls, v: str) -> str:
        v = v.strip().lower()
        if not _SUBDOMINIO_RE.match(v):
            raise ValueError("Subdominio inválido: usar solo minúsculas, números y guiones.")
        return v


class EmpresaUpdate(BaseModel):
    razon_social: Optional[str] = None
    email_admin: Optional[EmailStr] = None
    logo_url: Optional[str] = None
    color_acento: Optional[str] = None
    color_secundario: Optional[str] = None
    estado: Optional[EstadoEmpresa] = None


class EmpresaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    razon_social: str
    subdominio: str
    email_admin: EmailStr
    logo_url: Optional[str] = None
    color_acento: str
    color_secundario: str = "#6be1e3"
    estado: EstadoEmpresa
    created_at: dt.datetime
