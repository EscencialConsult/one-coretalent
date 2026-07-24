"""Notificación in-app para el Admin de Empresa (aislada por empresa)."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import Boolean, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPkMixin


class Notificacion(UUIDPkMixin, TimestampMixin, TenantMixin, Base):
    __tablename__ = "notificacion"

    # tipo del evento, p. ej. "resultado_completado".
    tipo: Mapped[str] = mapped_column(String(40), nullable=False)
    mensaje: Mapped[str] = mapped_column(String(300), nullable=False)
    # ruta interna a la que lleva el aviso (opcional), p. ej. /empresa/informe/<id>.
    link: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    leido: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("false")
    )
