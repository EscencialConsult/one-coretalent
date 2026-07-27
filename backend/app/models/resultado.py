"""Resultado calculado de un test rendido por un evaluado. Aislado por empresa."""
from __future__ import annotations

import uuid

from sqlalchemy import Index, JSON, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPkMixin


class Resultado(UUIDPkMixin, TimestampMixin, TenantMixin, Base):
    __tablename__ = "resultado"

    evaluado_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("evaluado.id", ondelete="CASCADE"), index=True, nullable=False
    )
    test_slug: Mapped[str] = mapped_column(String(64), nullable=False)
    persona_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("persona.id", ondelete="SET NULL"), index=True, nullable=True
    )
    catalogo_version: Mapped[str | None] = mapped_column(String(64), nullable=True)
    algoritmo_version: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # Salida completa del motor de scoring (determinista, sin IA), tal cual.
    datos: Mapped[dict] = mapped_column(JSON, nullable=False)

    __table_args__ = (
        # Cubre el hot path de _resultado_global/finalizar_evaluacion:
        # WHERE persona_id = :p AND test_slug = :s ORDER BY created_at DESC LIMIT 1.
        Index(
            "ix_resultado_persona_test_created",
            "persona_id", "test_slug", "created_at",
        ),
    )
