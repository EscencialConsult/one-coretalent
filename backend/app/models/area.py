"""Área / Departamento de la empresa (para agrupar miembros). Aislada por empresa."""
from __future__ import annotations

from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPkMixin


class Area(UUIDPkMixin, TimestampMixin, TenantMixin, Base):
    __tablename__ = "area"
    __table_args__ = (UniqueConstraint("tenant_id", "nombre", name="uq_area_tenant_nombre"),)

    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
