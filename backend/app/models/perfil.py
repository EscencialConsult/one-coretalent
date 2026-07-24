"""Perfil = etiqueta de clasificación de evaluados (ej. puesto/grupo), por empresa."""
from __future__ import annotations

from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPkMixin


class Perfil(UUIDPkMixin, TimestampMixin, TenantMixin, Base):
    __tablename__ = "perfil"
    __table_args__ = (UniqueConstraint("tenant_id", "nombre", name="uq_perfil_tenant_nombre"),)

    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
