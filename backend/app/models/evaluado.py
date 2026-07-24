"""Evaluado: candidato/colaborador que realiza las pruebas. Aislado por empresa."""
from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPkMixin


class Evaluado(UUIDPkMixin, TimestampMixin, TenantMixin, Base):
    __tablename__ = "evaluado"
    __table_args__ = (UniqueConstraint("tenant_id", "email", name="uq_evaluado_tenant_email"),)

    # "colaborador" (empleado: 360°/áreas/procesos) | "postulante" (candidato: tests de selección)
    tipo: Mapped[str] = mapped_column(
        String(16), nullable=False, default="colaborador", server_default=text("'colaborador'")
    )
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    apellido: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    perfil_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("perfil.id", ondelete="SET NULL"), nullable=True
    )
    area_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("area.id", ondelete="SET NULL"), nullable=True
    )
    # FK directa a la identidad global (ver models/persona.py). Se setea cuando la empresa
    # evalúa a alguien que se postuló — sobrevive si la Persona cambia de email más adelante.
    persona_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("persona.id", ondelete="SET NULL"), index=True, nullable=True
    )
    # Credenciales del evaluado para el portal (hash irreversible).
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
