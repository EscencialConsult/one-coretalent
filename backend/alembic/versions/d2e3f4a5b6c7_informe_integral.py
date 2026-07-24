"""informe_integral (informes gerenciales generados con IA)

Revision ID: d2e3f4a5b6c7
Revises: c1d2e3f4a5b6
Create Date: 2026-07-03 15:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d2e3f4a5b6c7"
down_revision: Union[str, None] = "c1d2e3f4a5b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "informe_integral",
        sa.Column("evaluado_id", sa.Uuid(), nullable=False),
        sa.Column("titulo", sa.String(length=200), nullable=False),
        sa.Column("tests", sa.JSON(), nullable=False),
        sa.Column("contenido", sa.JSON(), nullable=False),
        sa.Column("modelo", sa.String(length=64), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["evaluado_id"], ["evaluado.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tenant_id"], ["empresa.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_informe_integral_evaluado_id"), "informe_integral", ["evaluado_id"], unique=False)
    op.create_index(op.f("ix_informe_integral_tenant_id"), "informe_integral", ["tenant_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_informe_integral_tenant_id"), table_name="informe_integral")
    op.drop_index(op.f("ix_informe_integral_evaluado_id"), table_name="informe_integral")
    op.drop_table("informe_integral")
