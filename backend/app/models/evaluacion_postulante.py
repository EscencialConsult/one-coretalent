"""Acceso a resultados, auditoría y outbox del flujo de evaluación de postulantes."""
from __future__ import annotations

import datetime as dt
import uuid
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPkMixin


class AccesoResultado(UUIDPkMixin, TimestampMixin, TenantMixin, Base):
    __tablename__ = "acceso_resultado"

    resultado_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("resultado.id", ondelete="CASCADE"), index=True, nullable=False
    )
    persona_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("persona.id", ondelete="CASCADE"), index=True, nullable=False
    )
    postulacion_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("postulacion.id", ondelete="CASCADE"), index=True, nullable=False
    )
    asignacion_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("asignacion.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    revocado_at: Mapped[Optional[dt.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class EventoEvaluacion(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "evento_evaluacion"

    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("empresa.id", ondelete="CASCADE"), index=True, nullable=True
    )
    persona_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("persona.id", ondelete="SET NULL"), index=True, nullable=True
    )
    actor_tipo: Mapped[str] = mapped_column(String(30), nullable=False)
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True)
    accion: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    asignacion_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True)
    resultado_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True)
    acceso_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True)
    detalle: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)


class OutboxEvento(UUIDPkMixin, TimestampMixin, TenantMixin, Base):
    __tablename__ = "outbox_evento"

    tipo: Mapped[str] = mapped_column(String(50), nullable=False)
    persona_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("persona.id", ondelete="SET NULL"), index=True, nullable=True
    )
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    estado: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pendiente", server_default=text("'pendiente'")
    )
    intentos: Mapped[int] = mapped_column(nullable=False, default=0, server_default=text("0"))
    disponible_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    procesado_at: Mapped[Optional[dt.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ultimo_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
