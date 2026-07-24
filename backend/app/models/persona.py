"""Persona: identidad GLOBAL del candidato, compartida entre todas las empresas
(reemplaza la hoja "Perfiles" de Talent Hub — una fila por email, no por postulación).

A diferencia de Evaluado (aislado por empresa), Persona NO tiene tenant_id: es la
única entidad de negocio pensada para cruzar tenants, igual que en el sistema legacy.
Cuando una empresa evalúa psicométricamente a alguien que se postuló, se crea un
Evaluado con evaluado.persona_id apuntando acá (ver Evaluado.persona_id).
"""
from __future__ import annotations

import datetime as dt
from typing import Optional

from sqlalchemy import Boolean, DateTime, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPkMixin


class Persona(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "persona"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    apellido: Mapped[str] = mapped_column(String(120), nullable=False)
    telefono: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    puesto_deseado: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    fecha_nacimiento: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    identificacion: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    provincia: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    codigo_postal_ciudad: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    perfil_profesional: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    # Lista de estudios: [{"institucion": "...", "titulo": "...", "anio": "..."}, ...]
    # (igual estructura que la columna "Formacion" del Sheet legacy, no texto libre)
    formacion: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    descripcion_perfil: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    disp_viajar: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    disp_cambio_residencia: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    idiomas: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    primer_empleo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    experiencias: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    cv_nombre: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    cv_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    firma_consentimiento_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    firma_conformidad_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Recuperación de contraseña propia (self-service, a diferencia de Usuario/Evaluado
    # que hoy los resetea un admin) — mismo patrón que la hoja "Perfiles" legacy.
    reset_token: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    reset_expira: Mapped[Optional[dt.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
