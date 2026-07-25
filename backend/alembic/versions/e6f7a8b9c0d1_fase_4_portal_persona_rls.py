"""Fase 4: lectura del portal de Persona sobre sus postulaciones y vacantes.

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e6f7a8b9c0d1"
down_revision: Union[str, None] = "d5e6f7a8b9c0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TENANT = "NULLIF(current_setting('app.tenant_id', true), '')::uuid"
_PERSONA = "NULLIF(current_setting('app.persona_id', true), '')::uuid"


def upgrade() -> None:
    op.add_column("asignacion", sa.Column("consentida_at", sa.DateTime(timezone=True), nullable=True))
    op.execute("DROP POLICY tenant_isolation ON postulacion")
    op.execute(f"""CREATE POLICY tenant_isolation ON postulacion
        USING (
            current_setting('app.is_superadmin', true) = 'true'
            OR tenant_id = {_TENANT}
            OR persona_id = {_PERSONA}
        )
        WITH CHECK (
            current_setting('app.is_superadmin', true) = 'true'
            OR tenant_id = {_TENANT}
            OR persona_id = {_PERSONA}
        )""")
    op.execute("DROP POLICY tenant_isolation ON vacante")
    op.execute(f"""CREATE POLICY tenant_isolation ON vacante
        USING (
            current_setting('app.rls_pre_auth', true) = 'on'
            OR current_setting('app.is_superadmin', true) = 'true'
            OR tenant_id = {_TENANT}
            OR EXISTS (
                SELECT 1 FROM postulacion p
                WHERE p.vacante_id = vacante.id
                  AND p.persona_id = {_PERSONA}
            )
        )
        WITH CHECK (
            current_setting('app.is_superadmin', true) = 'true'
            OR tenant_id = {_TENANT}
        )""")


def downgrade() -> None:
    op.drop_column("asignacion", "consentida_at")
    op.execute("DROP POLICY tenant_isolation ON postulacion")
    op.execute(f"""CREATE POLICY tenant_isolation ON postulacion
        USING (current_setting('app.is_superadmin', true) = 'true' OR tenant_id = {_TENANT})
        WITH CHECK (current_setting('app.is_superadmin', true) = 'true' OR tenant_id = {_TENANT})""")
    op.execute("DROP POLICY tenant_isolation ON vacante")
    op.execute(f"""CREATE POLICY tenant_isolation ON vacante
        USING (
            current_setting('app.rls_pre_auth', true) = 'on'
            OR current_setting('app.is_superadmin', true) = 'true'
            OR tenant_id = {_TENANT}
        )
        WITH CHECK (current_setting('app.is_superadmin', true) = 'true' OR tenant_id = {_TENANT})""")
