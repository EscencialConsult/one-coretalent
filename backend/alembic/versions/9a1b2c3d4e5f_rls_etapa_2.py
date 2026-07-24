"""RLS para las tablas nuevas de Etapa 2 (vacante, postulacion, notificacion_vacante)

Revision ID: 9a1b2c3d4e5f
Revises: 382e7662c70f
Create Date: 2026-07-24 14:15:00.000000

Mismo patrón que la migración f1a2b3c4d5e6 (Etapa 1). ALTER DEFAULT PRIVILEGES ya le dio a
app_runtime los GRANT sobre estas tablas nuevas automáticamente (se fijó por rol+schema en
esa migración) — acá solo falta habilitar y forzar RLS + crear la política.

Deliberadamente NO se agrega política a `persona` ni a `evento_comercial` en esta migración:
- `persona` es la única entidad pensada para cruzar tenants a propósito (el motor de matching
  necesita buscar candidatos en TODA la base, no solo los de una empresa) y todavía no existe
  el flujo de auth propio del postulante (login self-service) que la Etapa 3 va a definir —
  diseñar la política ahora sería adivinar el patrón de acceso en vez de comprobarlo, que es
  como se terminó encontrando el bug real de `evaluado` en la Etapa 1. Se cierra en Etapa 3.
- `evento_comercial` es un log de auditoría interna, mismo criterio que `empresa`: no es dato
  de negocio expuesto a un tenant específico en los endpoints actuales.
"""
from typing import Sequence, Union

from alembic import op


revision: str = "9a1b2c3d4e5f"
down_revision: Union[str, None] = "382e7662c70f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLAS = ["vacante", "postulacion", "notificacion_vacante"]
_TENANT_ACTUAL = "NULLIF(current_setting('app.tenant_id', true), '')::uuid"


def _policy(tabla: str) -> str:
    return f"""
        CREATE POLICY tenant_isolation ON {tabla}
        USING (
            current_setting('app.is_superadmin', true) = 'true'
            OR tenant_id = {_TENANT_ACTUAL}
        )
        WITH CHECK (
            current_setting('app.is_superadmin', true) = 'true'
            OR tenant_id = {_TENANT_ACTUAL}
        );
    """


def upgrade() -> None:
    for tabla in _TABLAS:
        op.execute(f"ALTER TABLE {tabla} ENABLE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {tabla} FORCE ROW LEVEL SECURITY;")
        op.execute(_policy(tabla))


def downgrade() -> None:
    for tabla in _TABLAS:
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation ON {tabla};")
        op.execute(f"ALTER TABLE {tabla} NO FORCE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {tabla} DISABLE ROW LEVEL SECURITY;")
