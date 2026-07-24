"""RLS para persona y evento_comercial (Etapa 3 — cierra el gap dejado a propósito en 9a1b2c3d4e5f)

Revision ID: b2c3d4e5f6a7
Revises: 9a1b2c3d4e5f
Create Date: 2026-07-24 15:00:00.000000

Con el login self-service de Persona ya definido (app/api/deps.py:get_current_persona,
app/api/routes/auth.py:/auth/persona/login), el patrón de acceso real a `persona` es:
  - Registro/login público (email cruzando toda la base): app.rls_pre_auth.
  - SuperAdmin: ve todo (también lo usa el motor de matching, que necesita escanear
    TODA la base de candidatos para una vacante — se declara explícitamente is_superadmin
    en una sesión aparte y acotada, ver app/core/matching.py, nunca en la sesión del request).
  - La propia Persona logueada: app.persona_id = su propio id.
  - Una empresa: SOLO las Personas con las que tiene una relación real, es decir que
    tengan una Postulacion a alguna de sus Vacante (EXISTS) — nunca la base completa.

`evento_comercial` sigue el mismo patrón que `usuario` (tenant_id nullable, sin pre-auth
porque nada la busca antes de tener contexto): SuperAdmin ve todo, cada empresa ve la suya.
"""
from typing import Sequence, Union

from alembic import op


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "9a1b2c3d4e5f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TENANT_ACTUAL = "NULLIF(current_setting('app.tenant_id', true), '')::uuid"
_PERSONA_ACTUAL = "NULLIF(current_setting('app.persona_id', true), '')::uuid"


def upgrade() -> None:
    op.execute("ALTER TABLE persona ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE persona FORCE ROW LEVEL SECURITY;")
    op.execute(
        f"""
        CREATE POLICY tenant_isolation ON persona
        USING (
            current_setting('app.rls_pre_auth', true) = 'on'
            OR current_setting('app.is_superadmin', true) = 'true'
            OR id = {_PERSONA_ACTUAL}
            OR EXISTS (
                SELECT 1 FROM postulacion p
                WHERE p.persona_id = persona.id
                  AND p.tenant_id = {_TENANT_ACTUAL}
            )
        )
        WITH CHECK (
            current_setting('app.rls_pre_auth', true) = 'on'
            OR current_setting('app.is_superadmin', true) = 'true'
            OR id = {_PERSONA_ACTUAL}
        );
        """
    )

    op.execute("ALTER TABLE evento_comercial ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE evento_comercial FORCE ROW LEVEL SECURITY;")
    op.execute(
        f"""
        CREATE POLICY tenant_isolation ON evento_comercial
        USING (
            current_setting('app.is_superadmin', true) = 'true'
            OR tenant_id = {_TENANT_ACTUAL}
        )
        WITH CHECK (
            current_setting('app.is_superadmin', true) = 'true'
            OR tenant_id = {_TENANT_ACTUAL}
        );
        """
    )


def downgrade() -> None:
    for tabla in ("persona", "evento_comercial"):
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation ON {tabla};")
        op.execute(f"ALTER TABLE {tabla} NO FORCE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {tabla} DISABLE ROW LEVEL SECURITY;")
