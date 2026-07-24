"""Asignación de un test a un evaluado. Aislada por empresa."""
from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, String, UniqueConstraint, Uuid
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

    __table_args__ = (
        UniqueConstraint("evaluado_id", "test_slug", name="uq_asignacion_evaluado_test"),
    )
