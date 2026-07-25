"""Fase 3: evaluaciones de postulantes, progreso, accesos, auditoría y outbox.

Revision ID: d5e6f7a8b9c0
Revises: c3d4e5f6a7b8
Create Date: 2026-07-24 18:20:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d5e6f7a8b9c0"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TENANT = "NULLIF(current_setting('app.tenant_id', true), '')::uuid"
_PERSONA = "NULLIF(current_setting('app.persona_id', true), '')::uuid"


def upgrade() -> None:
    op.add_column("asignacion", sa.Column("persona_id", sa.Uuid(), nullable=True))
    op.add_column("asignacion", sa.Column("postulacion_id", sa.Uuid(), nullable=True))
    op.add_column("asignacion", sa.Column("respuestas_parciales", sa.JSON(), nullable=True))
    op.add_column("asignacion", sa.Column("iniciada_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("asignacion", sa.Column("progreso_guardado_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("asignacion", sa.Column("finalizada_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("asignacion", sa.Column("catalogo_version", sa.String(64), nullable=True))
    op.add_column("asignacion", sa.Column("algoritmo_version", sa.String(64), nullable=True))
    op.add_column("asignacion", sa.Column("resultado_reutilizado_id", sa.Uuid(), nullable=True))
    op.create_foreign_key("fk_asignacion_persona", "asignacion", "persona", ["persona_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key("fk_asignacion_postulacion", "asignacion", "postulacion", ["postulacion_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key("fk_asignacion_resultado_reutilizado", "asignacion", "resultado", ["resultado_reutilizado_id"], ["id"], ondelete="SET NULL")
    op.create_index("ix_asignacion_persona_id", "asignacion", ["persona_id"])
    op.create_index("ix_asignacion_postulacion_id", "asignacion", ["postulacion_id"])

    op.add_column("resultado", sa.Column("persona_id", sa.Uuid(), nullable=True))
    op.add_column("resultado", sa.Column("catalogo_version", sa.String(64), nullable=True))
    op.add_column("resultado", sa.Column("algoritmo_version", sa.String(64), nullable=True))
    op.create_foreign_key("fk_resultado_persona", "resultado", "persona", ["persona_id"], ["id"], ondelete="SET NULL")
    op.create_index("ix_resultado_persona_id", "resultado", ["persona_id"])

    op.create_table(
        "acceso_resultado",
        sa.Column("resultado_id", sa.Uuid(), nullable=False),
        sa.Column("persona_id", sa.Uuid(), nullable=False),
        sa.Column("postulacion_id", sa.Uuid(), nullable=False),
        sa.Column("asignacion_id", sa.Uuid(), nullable=False),
        sa.Column("revocado_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["resultado_id"], ["resultado.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["persona_id"], ["persona.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["postulacion_id"], ["postulacion.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["asignacion_id"], ["asignacion.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tenant_id"], ["empresa.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("asignacion_id", name="uq_acceso_resultado_asignacion"),
    )
    for col in ("tenant_id", "resultado_id", "persona_id", "postulacion_id"):
        op.create_index(f"ix_acceso_resultado_{col}", "acceso_resultado", [col])

    op.create_table(
        "evento_evaluacion",
        sa.Column("tenant_id", sa.Uuid(), nullable=True),
        sa.Column("persona_id", sa.Uuid(), nullable=True),
        sa.Column("actor_tipo", sa.String(30), nullable=False),
        sa.Column("actor_id", sa.Uuid(), nullable=True),
        sa.Column("accion", sa.String(40), nullable=False),
        sa.Column("asignacion_id", sa.Uuid(), nullable=True),
        sa.Column("resultado_id", sa.Uuid(), nullable=True),
        sa.Column("acceso_id", sa.Uuid(), nullable=True),
        sa.Column("detalle", sa.JSON(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["empresa.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["persona_id"], ["persona.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_evento_evaluacion_tenant_id", "evento_evaluacion", ["tenant_id"])
    op.create_index("ix_evento_evaluacion_persona_id", "evento_evaluacion", ["persona_id"])
    op.create_index("ix_evento_evaluacion_accion", "evento_evaluacion", ["accion"])

    op.create_table(
        "outbox_evento",
        sa.Column("tipo", sa.String(50), nullable=False),
        sa.Column("persona_id", sa.Uuid(), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("estado", sa.String(20), server_default=sa.text("'pendiente'"), nullable=False),
        sa.Column("intentos", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("disponible_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("procesado_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ultimo_error", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["empresa.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["persona_id"], ["persona.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_outbox_evento_tenant_id", "outbox_evento", ["tenant_id"])
    op.create_index("ix_outbox_evento_persona_id", "outbox_evento", ["persona_id"])
    op.create_index("ix_outbox_pendientes", "outbox_evento", ["estado", "disponible_at"])

    for tabla in ("acceso_resultado", "outbox_evento"):
        op.execute(f"ALTER TABLE {tabla} ENABLE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE {tabla} FORCE ROW LEVEL SECURITY")
        persona_clause = " OR persona_id = " + _PERSONA
        op.execute(f"""CREATE POLICY tenant_isolation ON {tabla}
            USING (current_setting('app.is_superadmin', true) = 'true' OR tenant_id = {_TENANT}{persona_clause})
            WITH CHECK (current_setting('app.is_superadmin', true) = 'true' OR tenant_id = {_TENANT}{persona_clause})""")

    op.execute("ALTER TABLE evento_evaluacion ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE evento_evaluacion FORCE ROW LEVEL SECURITY")
    op.execute(f"""CREATE POLICY tenant_isolation ON evento_evaluacion
        USING (current_setting('app.is_superadmin', true) = 'true' OR tenant_id = {_TENANT} OR persona_id = {_PERSONA})
        WITH CHECK (current_setting('app.is_superadmin', true) = 'true' OR tenant_id = {_TENANT} OR persona_id = {_PERSONA})""")

    op.execute("DROP POLICY tenant_isolation ON asignacion")
    op.execute(f"""CREATE POLICY tenant_isolation ON asignacion
        USING (current_setting('app.is_superadmin', true) = 'true' OR tenant_id = {_TENANT} OR persona_id = {_PERSONA})
        WITH CHECK (current_setting('app.is_superadmin', true) = 'true' OR tenant_id = {_TENANT} OR persona_id = {_PERSONA})""")

    op.execute("DROP POLICY tenant_isolation ON resultado")
    op.execute(f"""CREATE POLICY tenant_isolation ON resultado
        USING (
            current_setting('app.is_superadmin', true) = 'true'
            OR tenant_id = {_TENANT}
            OR persona_id = {_PERSONA}
            OR EXISTS (
                SELECT 1 FROM acceso_resultado ar
                WHERE ar.resultado_id = resultado.id
                  AND ar.tenant_id = {_TENANT}
                  AND ar.revocado_at IS NULL
            )
        )
        WITH CHECK (
            current_setting('app.is_superadmin', true) = 'true'
            OR tenant_id = {_TENANT}
            OR persona_id = {_PERSONA}
        )""")


def downgrade() -> None:
    op.execute("DROP POLICY tenant_isolation ON resultado")
    op.execute(f"""CREATE POLICY tenant_isolation ON resultado
        USING (current_setting('app.is_superadmin', true) = 'true' OR tenant_id = {_TENANT})
        WITH CHECK (current_setting('app.is_superadmin', true) = 'true' OR tenant_id = {_TENANT})""")
    op.execute("DROP POLICY tenant_isolation ON asignacion")
    op.execute(f"""CREATE POLICY tenant_isolation ON asignacion
        USING (current_setting('app.is_superadmin', true) = 'true' OR tenant_id = {_TENANT})
        WITH CHECK (current_setting('app.is_superadmin', true) = 'true' OR tenant_id = {_TENANT})""")
    for tabla in ("outbox_evento", "evento_evaluacion", "acceso_resultado"):
        op.drop_table(tabla)
    for col in ("algoritmo_version", "catalogo_version", "persona_id"):
        op.drop_column("resultado", col)
    for col in (
        "resultado_reutilizado_id", "algoritmo_version", "catalogo_version", "finalizada_at",
        "progreso_guardado_at", "iniciada_at", "respuestas_parciales", "postulacion_id", "persona_id",
    ):
        op.drop_column("asignacion", col)
