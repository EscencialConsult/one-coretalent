"""Postulación: vincula una Persona con una Vacante (reemplaza la hoja "Postulantes",
que tenía una fila por postulación, no por persona). Aislada por empresa a través de
la vacante — vive en el tenant de la empresa que publicó la vacante."""
from __future__ import annotations

import datetime as dt
import uuid
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, JSON, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPkMixin


class Postulacion(UUIDPkMixin, TimestampMixin, TenantMixin, Base):
    __tablename__ = "postulacion"
    __table_args__ = (
        UniqueConstraint("persona_id", "vacante_id", name="uq_postulacion_persona_vacante"),
    )

    persona_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("persona.id", ondelete="CASCADE"), index=True, nullable=False
    )
    vacante_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("vacante.id", ondelete="CASCADE"), index=True, nullable=False
    )
    # Respuestas a Vacante.pregunta_1/pregunta_2, si la vacante las pedía: {"pregunta_1": "...", ...}
    respuestas_busqueda: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    firma_consentimiento_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    fecha_firma_consentimiento: Mapped[Optional[dt.datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    firma_conformidad_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    fecha_firma_conformidad: Mapped[Optional[dt.datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
