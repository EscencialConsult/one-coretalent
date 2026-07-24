"""Auditoría de los emails de matching automático enviados a candidatos (reemplaza
la hoja "NotificacionesVacantes"). Aislada por empresa a través de la vacante."""
from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPkMixin


class NotificacionVacante(UUIDPkMixin, TimestampMixin, TenantMixin, Base):
    __tablename__ = "notificacion_vacante"

    vacante_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("vacante.id", ondelete="CASCADE"), index=True, nullable=False
    )
    persona_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("persona.id", ondelete="CASCADE"), index=True, nullable=False
    )
    puntaje: Mapped[int] = mapped_column(Integer, nullable=False)
    motivos: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # enviado | error | omitido (tope diario alcanzado)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="enviado")
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
