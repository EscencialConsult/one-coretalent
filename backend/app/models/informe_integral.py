"""Informe gerencial integral generado con IA a partir de varios tests de un evaluado.

La IA solo redacta la narrativa; los resultados de cada test son deterministas e
inmodificables. Se guarda para tener historial y no re-gastar tokens.
"""
from __future__ import annotations

import uuid

from sqlalchemy import JSON, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPkMixin


class InformeIntegral(UUIDPkMixin, TimestampMixin, TenantMixin, Base):
    __tablename__ = "informe_integral"

    evaluado_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("evaluado.id", ondelete="CASCADE"), index=True, nullable=False
    )
    titulo: Mapped[str] = mapped_column(String(200), nullable=False, default="Informe integral")
    # Snapshot de qué resultados se integraron: [{"resultado_id","slug","nombre"}]
    tests: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    # Narrativa generada por la IA (secciones). Ver core/ia.py para la forma.
    contenido: Mapped[dict] = mapped_column(JSON, nullable=False)
    modelo: Mapped[str] = mapped_column(String(64), nullable=False, default="")
