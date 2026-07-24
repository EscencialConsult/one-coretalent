"""Esquemas de autenticación y salida de usuario."""
from __future__ import annotations

import uuid
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.enums import RolUsuario


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    nombre: str
    apellido: str
    rol: RolUsuario
    tenant_id: Optional[uuid.UUID] = None
