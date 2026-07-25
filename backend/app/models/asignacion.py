"""Asignación de un test a un evaluado. Aislada por empresa."""
from __future__ import annotations

import datetime as dt
import uuid
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, JSON, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPkMixin


class Asignacion(UUIDPkMixin, TimestampMixin, TenantMixin, Base):
    __tablename__ = "asignacion"

    evaluado_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("evaluado.id", ondelete="CASCADE"), index=True, nullable=False
    )
    test_slug: Mapped[str] = mapped_column(String(64), nullable=False)
    # "pendiente" | "completado"
    estado: Mapped[str] = mapped_column(String(20), default="pendiente", nullable=False)
    persona_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("persona.id", ondelete="CASCADE"), index=True, nullable=True
    )
    postulacion_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("postulacion.id", ondelete="CASCADE"), index=True, nullable=True
    )
    respuestas_parciales: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    iniciada_at: Mapped[Optional[dt.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    consentida_at: Mapped[Optional[dt.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    progreso_guardado_at: Mapped[Optional[dt.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    finalizada_at: Mapped[Optional[dt.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    catalogo_version: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    algoritmo_version: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    resultado_reutilizado_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("resultado.id", ondelete="SET NULL"), nullable=True
    )

    __table_args__ = (
        UniqueConstraint("evaluado_id", "test_slug", name="uq_asignacion_evaluado_test"),
    )
