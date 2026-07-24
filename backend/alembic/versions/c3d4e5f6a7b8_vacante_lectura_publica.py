"""vacante: permitir lectura pública (listado sin login + postularse) bajo rls_pre_auth

Revision ID: c3d4e5f6a7b8
Revises: 846a073af1b6
Create Date: 2026-07-24 15:20:00.000000

Encontrado probando de verdad (mismo patrón que el bug de `evaluado` en la Etapa 1):
GET /publico/vacantes (busquedas.html) y POST /publico/postular necesitan leer vacantes
SIN tener un tenant resuelto todavía — la política estándar (is_superadmin OR tenant_id =
tenant actual) los deja ciegos. Reusa el mismo flag app.rls_pre_auth que ya usan
usuario/evaluado/persona — acá el "pre-auth" es "antes de tener contexto de tenant",
mismo concepto. El WHERE estado='activa' de /publico/vacantes y el chequeo explícito en
/publico/postular siguen limitando qué se expone; esto solo evita que RLS sea MÁS
restrictivo que el propio filtro del endpoint.
"""
from typing import Sequence, Union

from alembic import op


revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "846a073af1b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TENANT_ACTUAL = "NULLIF(current_setting('app.tenant_id', true), '')::uuid"


def upgrade() -> None:
    op.execute("DROP POLICY IF EXISTS tenant_isolation ON vacante;")
    op.execute(
        f"""
        CREATE POLICY tenant_isolation ON vacante
        USING (
            current_setting('app.rls_pre_auth', true) = 'on'
            OR current_setting('app.is_superadmin', true) = 'true'
            OR tenant_id = {_TENANT_ACTUAL}
        )
        WITH CHECK (
            current_setting('app.is_superadmin', true) = 'true'
            OR tenant_id = {_TENANT_ACTUAL}
        );
        """
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS tenant_isolation ON vacante;")
    op.execute(
        f"""
        CREATE POLICY tenant_isolation ON vacante
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
