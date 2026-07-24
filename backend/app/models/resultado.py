"""Resultado calculado de un test rendido por un evaluado. Aislado por empresa."""
from __future__ import annotations

import uuid

from sqlalchemy import JSON, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPkMixin


class Resultado(UUIDPkMixin, TimestampMixin, TenantMixin, Base):
    __tablename__ = "resultado"

    evaluado_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("evaluado.id", ondelete="CASCADE"), index=True, nullable=False
    )
    test_slug: Mapped[str] = mapped_column(String(64), nullable=False)
    # Salida completa del motor de scoring (determinista, sin IA), tal cual.
    datos: Mapped[dict] = mapped_column(JSON, nullable=False)
