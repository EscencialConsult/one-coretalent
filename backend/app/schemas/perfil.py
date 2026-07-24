"""Esquemas de Perfil (etiquetas de evaluados por empresa)."""
from __future__ import annotations

import datetime as dt
import uuid

from pydantic import BaseModel, ConfigDict, field_validator


class PerfilCreate(BaseModel):
    nombre: str

    @field_validator("nombre")
    @classmethod
    def _no_vacio(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("El nombre del perfil no puede estar vacío.")
        return v


class PerfilOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str
    created_at: dt.datetime
