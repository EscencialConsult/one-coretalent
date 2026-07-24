"""Tests en alcance por empresa.

La fila = el test está en el alcance de la empresa (fue añadido por el SuperAdmin).
`habilitado` permite deshabilitarlo temporalmente sin sacarlo del alcance (borrar la fila).
"""
from __future__ import annotations

from sqlalchemy import Boolean, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPkMixin


class EmpresaTest(UUIDPkMixin, TimestampMixin, TenantMixin, Base):
    __tablename__ = "empresa_test"

    # slug del test en el catálogo (carpeta de catalogo/), p. ej. "big-five".
    test_slug: Mapped[str] = mapped_column(String(64), nullable=False)
    # True = la empresa lo ve/puede asignar. False = añadido pero pausado.
    habilitado: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )

    __table_args__ = (
        UniqueConstraint("tenant_id", "test_slug", name="uq_empresa_test"),
    )
