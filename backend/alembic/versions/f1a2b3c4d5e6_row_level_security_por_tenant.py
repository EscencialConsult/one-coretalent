"""Row Level Security por tenant (rol app_runtime + políticas)

Revision ID: f1a2b3c4d5e6
Revises: e6f5a4b3c2d1
Create Date: 2026-07-24 13:40:00.000000

Cierra la deuda documentada en TenantMixin (base.py): hasta ahora el aislamiento entre
empresas dependía SOLO de que cada endpoint filtrara bien por tenant_id. Esta migración
agrega una barrera real a nivel de base de datos.

Requiere correr con un rol que tenga privilegios DDL (BYPASSRLS/superuser) — ej. el rol
`postgres` de Supabase — vía DATABASE_URL_MIGRATIONS. El rol `app_runtime` que se crea acá
es el que usa la app en runtime (DATABASE_URL): sin BYPASSRLS, así las políticas aplican
de verdad.

Contexto de sesión que la app fija por request (ver app/core/db.py):
  - app.tenant_id: UUID del tenant actual (vacío si no aplica, ej. SuperAdmin).
  - app.is_superadmin: 'true' para el SuperAdmin (ve todo, cruza tenants a propósito).
  - app.rls_pre_auth: 'on' SOLO durante las 2-3 búsquedas que por diseño necesitan
    mirar a través de todos los tenants antes de conocer la identidad (login por email,
    respuesta pública de evaluación 360° por token). Nunca habilitado para escrituras
    (no aparece en ningún WITH CHECK) — es de solo lectura y de alcance de transacción.
"""
from typing import Sequence, Union

from alembic import op


revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, None] = "e6f5a4b3c2d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Tablas con tenant_id NOT NULL y sin ningún caso especial: la política es siempre la misma.
_TABLAS_ESTANDAR = [
    "area",
    "asignacion",
    "empresa_test",
    "informe_integral",
    "notificacion",
    "perfil",
    "resultado",
    "eval_campania",
    "eval_evaluador",
]

# Expresión segura: si app.tenant_id no está seteado (o está vacío, caso SuperAdmin),
# NULLIF lo convierte en NULL antes de castear — evita "invalid input syntax for type uuid"
# sin depender de que Postgres evalúe el OR estrictamente de izquierda a derecha.
_TENANT_ACTUAL = "NULLIF(current_setting('app.tenant_id', true), '')::uuid"


def _policy_estandar(tabla: str) -> str:
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
    # 1) Rol de runtime, sin privilegios de superusuario ni BYPASSRLS.
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_runtime') THEN
                CREATE ROLE app_runtime WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
                    NOBYPASSRLS NOREPLICATION;
            END IF;
        END
        $$;
        """
    )
    op.execute("GRANT CONNECT ON DATABASE postgres TO app_runtime;")
    op.execute("GRANT USAGE ON SCHEMA public TO app_runtime;")
    op.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;")
    op.execute("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;")
    op.execute(
        "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;"
    )
    op.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;")

    # 2) Tablas estándar: tenant_id obligatorio, política única reutilizada.
    for tabla in _TABLAS_ESTANDAR:
        op.execute(f"ALTER TABLE {tabla} ENABLE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {tabla} FORCE ROW LEVEL SECURITY;")
        op.execute(_policy_estandar(tabla))

    # 3) usuario y evaluado: ambas tienen login propio que busca por email en TODOS los
    #    tenants antes de saber cuál es (el email es único solo POR tenant, no global) —
    #    necesitan el bypass de pre-auth. usuario además tiene tenant_id nullable (NULL = SuperAdmin).
    op.execute("ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE usuario FORCE ROW LEVEL SECURITY;")
    op.execute(
        f"""
        CREATE POLICY tenant_isolation ON usuario
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

    op.execute("ALTER TABLE evaluado ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE evaluado FORCE ROW LEVEL SECURITY;")
    op.execute(
        f"""
        CREATE POLICY tenant_isolation ON evaluado
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

    # 4) eval_formulario: tenant_id nullable (NULL = plantilla global del SuperAdmin,
    #    visible para TODAS las empresas, no solo para el SuperAdmin).
    op.execute("ALTER TABLE eval_formulario ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE eval_formulario FORCE ROW LEVEL SECURITY;")
    op.execute(
        f"""
        CREATE POLICY tenant_isolation ON eval_formulario
        USING (
            current_setting('app.rls_pre_auth', true) = 'on'
            OR current_setting('app.is_superadmin', true) = 'true'
            OR tenant_id IS NULL
            OR tenant_id = {_TENANT_ACTUAL}
        )
        WITH CHECK (
            current_setting('app.is_superadmin', true) = 'true'
            OR tenant_id = {_TENANT_ACTUAL}
        );
        """
    )

    # 5) eval_competencia / eval_pregunta: no tienen columna tenant_id propia — heredan
    #    el alcance del formulario al que pertenecen (directo o a través de la competencia).
    op.execute("ALTER TABLE eval_competencia ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE eval_competencia FORCE ROW LEVEL SECURITY;")
    op.execute(
        f"""
        CREATE POLICY tenant_isolation ON eval_competencia
        USING (
            current_setting('app.rls_pre_auth', true) = 'on'
            OR current_setting('app.is_superadmin', true) = 'true'
            OR EXISTS (
                SELECT 1 FROM eval_formulario f
                WHERE f.id = eval_competencia.formulario_id
                  AND (f.tenant_id IS NULL OR f.tenant_id = {_TENANT_ACTUAL})
            )
        )
        WITH CHECK (
            current_setting('app.is_superadmin', true) = 'true'
            OR EXISTS (
                SELECT 1 FROM eval_formulario f
                WHERE f.id = eval_competencia.formulario_id
                  AND (f.tenant_id IS NULL OR f.tenant_id = {_TENANT_ACTUAL})
            )
        );
        """
    )

    op.execute("ALTER TABLE eval_pregunta ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE eval_pregunta FORCE ROW LEVEL SECURITY;")
    op.execute(
        f"""
        CREATE POLICY tenant_isolation ON eval_pregunta
        USING (
            current_setting('app.rls_pre_auth', true) = 'on'
            OR current_setting('app.is_superadmin', true) = 'true'
            OR EXISTS (
                SELECT 1 FROM eval_competencia c
                JOIN eval_formulario f ON f.id = c.formulario_id
                WHERE c.id = eval_pregunta.competencia_id
                  AND (f.tenant_id IS NULL OR f.tenant_id = {_TENANT_ACTUAL})
            )
        )
        WITH CHECK (
            current_setting('app.is_superadmin', true) = 'true'
            OR EXISTS (
                SELECT 1 FROM eval_competencia c
                JOIN eval_formulario f ON f.id = c.formulario_id
                WHERE c.id = eval_pregunta.competencia_id
                  AND (f.tenant_id IS NULL OR f.tenant_id = {_TENANT_ACTUAL})
            )
        );
        """
    )


def downgrade() -> None:
    todas = _TABLAS_ESTANDAR + ["usuario", "evaluado", "eval_formulario", "eval_competencia", "eval_pregunta"]
    for tabla in todas:
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation ON {tabla};")
        op.execute(f"ALTER TABLE {tabla} NO FORCE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {tabla} DISABLE ROW LEVEL SECURITY;")
    op.execute("REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_runtime;")
    op.execute("REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM app_runtime;")
    op.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM app_runtime;")
    op.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM app_runtime;")
    op.execute("REVOKE USAGE ON SCHEMA public FROM app_runtime;")
    op.execute("REVOKE CONNECT ON DATABASE postgres FROM app_runtime;")
    op.execute("DROP ROLE IF EXISTS app_runtime;")
