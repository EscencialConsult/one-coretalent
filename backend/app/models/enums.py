"""Enumeraciones del dominio."""
from __future__ import annotations

import enum


class RolUsuario(str, enum.Enum):
    SUPERADMIN = "superadmin"
    ADMIN_EMPRESA = "admin_empresa"


class EstadoEmpresa(str, enum.Enum):
    ACTIVO = "activo"
    SUSPENDIDO = "suspendido"
    # Alta pública (auto-registro con verificación de identidad, flujo de Talent Hub) —
    # a diferencia del alta de Plataforma ONE, que hoy solo la da de alta el SuperAdmin ya activa.
    PENDIENTE_VERIFICACION = "pendiente_verificacion"
    RECHAZADA = "rechazada"
