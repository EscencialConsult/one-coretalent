"""asignacion (tests asignados a evaluados)

Revision ID: c3d2e1f0a9b8
Revises: b2f1a9c4d7e3
Create Date: 2026-06-30 15:30:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c3d2e1f0a9b8"
down_revision: Union[str, None] = "b2f1a9c4d7e3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "asignacion",
        sa.Column("evaluado_id", sa.Uuid(), nullable=False),
        sa.Column("test_slug", sa.String(length=64), nullable=False),
        sa.Column("estado", sa.String(length=20), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["evaluado_id"], ["evaluado.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tenant_id"], ["empresa.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("evaluado_id", "test_slug", name="uq_asignacion_evaluado_test"),
    )
    op.create_index(op.f("ix_asignacion_evaluado_id"), "asignacion", ["evaluado_id"], unique=False)
    op.create_index(op.f("ix_asignacion_tenant_id"), "asignacion", ["tenant_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_asignacion_tenant_id"), table_name="asignacion")
    op.drop_index(op.f("ix_asignacion_evaluado_id"), table_name="asignacion")
    op.drop_table("asignacion")
