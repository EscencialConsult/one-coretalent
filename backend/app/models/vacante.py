"""Vacante: búsqueda laboral publicada por una empresa (reemplaza la hoja "Busquedas").
Aislada por empresa (tenant_id) — la publica el Admin de Empresa desde su panel."""
from __future__ import annotations

import datetime as dt
from typing import Optional

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin, UUIDPkMixin


class Vacante(UUIDPkMixin, TimestampMixin, TenantMixin, Base):
    __tablename__ = "vacante"

    puesto: Mapped[str] = mapped_column(String(160), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    provincia: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    localidad: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    modalidad: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)  # presencial|remoto|hibrido
    jornada: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    vacantes: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    # borrador | activa | pausada | cerrada
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="borrador")
    area: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    tipo_contrato: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    zona: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    responsabilidades: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    requisitos_excluyentes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    requisitos_deseables: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    habilidades: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    idioma_requerido: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    nivel_idioma: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    salario_min: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    salario_max: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    ocultar_salario: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    horario: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    beneficios: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    beneficios_otros: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    fecha_vencimiento: Mapped[Optional[dt.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reclutador: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    # Preguntas de filtrado que el postulante responde al aplicar (opcionales).
    pregunta_1: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pregunta_2: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
