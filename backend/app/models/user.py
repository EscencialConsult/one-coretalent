"""Usuario administrador: SuperAdmin (global) o Admin de Empresa (con tenant_id)."""
from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import Boolean, Enum as SAEnum, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPkMixin
from app.models.enums import RolUsuario


class Usuario(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "usuario"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    apellido: Mapped[str] = mapped_column(String(120), nullable=False)
    rol: Mapped[RolUsuario] = mapped_column(
        SAEnum(RolUsuario, name="rol_usuario", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    # NULL para SuperAdmin (global); con valor para Admin de Empresa.
    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("empresa.id", ondelete="CASCADE"), index=True, nullable=True
    )
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
