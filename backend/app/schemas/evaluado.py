"""Esquemas de Evaluado."""
from __future__ import annotations

import datetime as dt
import uuid
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr

TIPOS_EVALUADO = {"colaborador", "postulante"}


class EvaluadoCreate(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    tipo: str = "colaborador"  # colaborador | postulante
    perfil_id: Optional[uuid.UUID] = None
    area_id: Optional[uuid.UUID] = None
    # Contraseña de acceso del evaluado (opcional al crear).
    password: Optional[str] = None


class EvaluadoUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    tipo: Optional[str] = None
    perfil_id: Optional[uuid.UUID] = None
    area_id: Optional[uuid.UUID] = None
    activo: Optional[bool] = None


class EvaluadoImportItem(BaseModel):
    nombre: str
    apellido: str = ""
    email: EmailStr
    tipo: Optional[str] = None    # colaborador | postulante (default colaborador)
    area: Optional[str] = None    # nombre del área (se crea si no existe)
    puesto: Optional[str] = None  # nombre del perfil (se crea si no existe)


class EvaluadoImport(BaseModel):
    items: List[EvaluadoImportItem]


class EvaluadoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str
    apellido: str
    email: EmailStr
    tipo: str = "colaborador"
    perfil_id: Optional[uuid.UUID] = None
    area_id: Optional[uuid.UUID] = None
    activo: bool
    created_at: dt.datetime
