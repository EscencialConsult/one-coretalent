from __future__ import annotations

import datetime as dt
import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class EvaluacionPostulanteCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    test_slug: str = Field(min_length=1, max_length=64, pattern=r"^[a-z0-9-]+$")


class RespuestasProgresoIn(BaseModel):
    respuestas: dict[str, Any]


class FinalizarEvaluacionIn(BaseModel):
    respuestas: dict[str, Any] | None = None


class IniciarEvaluacionIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    acepta_consentimiento: bool


class EvaluacionResumenOut(BaseModel):
    id: uuid.UUID
    test_slug: str
    test_nombre: str
    estado: str
    reutilizada: bool
    resultado_id: uuid.UUID | None = None
    acceso_resultado_id: uuid.UUID | None = None
    acceso_revocado: bool = False
    iniciada_at: dt.datetime | None = None
    progreso_guardado_at: dt.datetime | None = None
    finalizada_at: dt.datetime | None = None
    created_at: dt.datetime
    empresa_nombre: str | None = None
    empresa_logo_url: str | None = None
    empresa_color_acento: str | None = None
    empresa_color_secundario: str | None = None


class ProgresoOut(BaseModel):
    id: uuid.UUID
    estado: str
    respuestas: dict[str, Any]
    progreso_guardado_at: dt.datetime | None = None


class ResultadoResumenOut(BaseModel):
    id: uuid.UUID
    test_slug: str
    test_nombre: str
    catalogo_version: str | None
    algoritmo_version: str | None
    created_at: dt.datetime
