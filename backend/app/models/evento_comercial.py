"""Auditoría interna general (reemplaza la hoja "EventosComerciales"): registro,
verificaciones de empresa, exportaciones, etc. tenant_id nullable porque algunos
eventos son a nivel de sistema (ej. acciones del SuperAdmin), no de una empresa puntual."""
from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPkMixin


class EventoComercial(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "evento_comercial"

    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("empresa.id", ondelete="CASCADE"), index=True, nullable=True
    )
    usuario_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("usuario.id", ondelete="SET NULL"), nullable=True
    )
    tipo_evento: Mapped[str] = mapped_column(String(60), nullable=False)
    detalle: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    canal: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    destinatarios: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    estado_notificacion: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
