"""resultado (resultados calculados de tests)

Revision ID: d4e3f2a1b0c9
Revises: c3d2e1f0a9b8
Create Date: 2026-06-30 16:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d4e3f2a1b0c9"
down_revision: Union[str, None] = "c3d2e1f0a9b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "resultado",
        sa.Column("evaluado_id", sa.Uuid(), nullable=False),
        sa.Column("test_slug", sa.String(length=64), nullable=False),
        sa.Column("datos", sa.JSON(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["evaluado_id"], ["evaluado.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tenant_id"], ["empresa.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_resultado_evaluado_id"), "resultado", ["evaluado_id"], unique=False)
    op.create_index(op.f("ix_resultado_tenant_id"), "resultado", ["tenant_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_resultado_tenant_id"), table_name="resultado")
    op.drop_index(op.f("ix_resultado_evaluado_id"), table_name="resultado")
    op.drop_table("resultado")
