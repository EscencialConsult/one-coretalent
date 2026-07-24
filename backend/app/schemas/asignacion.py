"""Esquemas de Asignación de tests a evaluados."""
from __future__ import annotations

import datetime as dt
import uuid

from pydantic import BaseModel, ConfigDict


class AsignacionCreate(BaseModel):
    test_slug: str


class AsignacionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    evaluado_id: uuid.UUID
    test_slug: str
    estado: str
    created_at: dt.datetime
