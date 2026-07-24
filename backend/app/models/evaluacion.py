"""Módulo de Evaluaciones (360° de personas, Áreas/Departamentos y Procesos internos).

Modelo genérico: un FORMULARIO (competencias → preguntas, con una escala) que puede ser
plantilla global (SuperAdmin) o propio de una empresa. Una CAMPAÑA aplica un formulario a un
SUJETO (persona, área o proceso) y define su red de EVALUADORES; cada uno responde por un link
con token. El cálculo es determinista (promedios / % de cumplimiento), sin IA.
"""
from __future__ import annotations

import datetime as dt
import uuid
from typing import Optional

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Uuid,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPkMixin

# tipo de campaña/formulario
TIPO_360 = "personas_360"
TIPO_AREAS = "areas"
TIPO_PROCESOS = "procesos"
TIPO_CLIENTES = "clientes"  # los evaluadores son clientes externos (satisfacción)
# escala
ESCALA_LIKERT = "likert5"
ESCALA_SINO = "sino"
ESCALA_SATISFACCION = "satisfaccion"  # 1-5: Muy insatisfecho → Muy satisfecho (numérica, como likert)


class EvalFormulario(UUIDPkMixin, TimestampMixin, Base):
    """Formulario/plantilla. tenant_id NULL = plantilla global del SuperAdmin."""

    __tablename__ = "eval_formulario"

    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("empresa.id", ondelete="CASCADE"), index=True, nullable=True
    )
    nombre: Mapped[str] = mapped_column(String(160), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False, default=TIPO_360)
    escala: Mapped[str] = mapped_column(String(20), nullable=False, default=ESCALA_LIKERT)
    # True = plantilla reutilizable (las globales del SuperAdmin lo son).
    es_plantilla: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("false")
    )


class EvalCompetencia(UUIDPkMixin, Base):
    __tablename__ = "eval_competencia"

    formulario_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("eval_formulario.id", ondelete="CASCADE"), index=True, nullable=False
    )
    nombre: Mapped[str] = mapped_column(String(160), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    orden: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class EvalPregunta(UUIDPkMixin, Base):
    __tablename__ = "eval_pregunta"

    competencia_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("eval_competencia.id", ondelete="CASCADE"), index=True, nullable=False
    )
    texto: Mapped[str] = mapped_column(Text, nullable=False)
    orden: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class EvalCampania(UUIDPkMixin, TimestampMixin, TenantMixin, Base):
    __tablename__ = "eval_campania"

    nombre: Mapped[str] = mapped_column(String(160), nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    escala: Mapped[str] = mapped_column(String(20), nullable=False, default=ESCALA_LIKERT)
    # Snapshot inmutable del formulario al crear la campaña: {competencias:[{id,nombre,preguntas:[{id,texto}]}]}
    estructura: Mapped[dict] = mapped_column(JSON, nullable=False)
    formulario_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("eval_formulario.id", ondelete="SET NULL"), nullable=True
    )
    # Sujeto evaluado: nombre libre (persona, área o proceso). Si es una persona del sistema, se enlaza.
    sujeto_nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    sujeto_evaluado_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("evaluado.id", ondelete="SET NULL"), nullable=True
    )
    estado: Mapped[str] = mapped_column(String(12), nullable=False, default="borrador")  # borrador|abierta|cerrada
    anonimato_min: Mapped[int] = mapped_column(Integer, nullable=False, default=3)


class EvalEvaluador(UUIDPkMixin, TimestampMixin, TenantMixin, Base):
    __tablename__ = "eval_evaluador"

    campania_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("eval_campania.id", ondelete="CASCADE"), index=True, nullable=False
    )
    # 360°: auto|supervisor|par|reporte  ·  áreas/procesos: observador
    relacion: Mapped[str] = mapped_column(String(12), nullable=False)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    evaluado_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("evaluado.id", ondelete="SET NULL"), nullable=True
    )
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    estado: Mapped[str] = mapped_column(String(12), nullable=False, default="pendiente")  # pendiente|completado
    # {pregunta_id: valor}  · likert5 → 1..5 · sino → 0/1
    respuestas: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    fecha_respuesta: Mapped[Optional[dt.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
