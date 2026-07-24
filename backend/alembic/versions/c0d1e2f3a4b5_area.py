"""área/departamento + evaluado.area_id

Revision ID: c0d1e2f3a4b5
Revises: b9c8d7e6f5a4
Create Date: 2026-07-02 16:30:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c0d1e2f3a4b5"
down_revision: Union[str, None] = "b9c8d7e6f5a4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "area",
        sa.Column("nombre", sa.String(length=120), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["empresa.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "nombre", name="uq_area_tenant_nombre"),
    )
    op.create_index(op.f("ix_area_tenant_id"), "area", ["tenant_id"], unique=False)

    op.add_column("evaluado", sa.Column("area_id", sa.Uuid(), nullable=True))
    op.create_foreign_key("fk_evaluado_area", "evaluado", "area", ["area_id"], ["id"], ondelete="SET NULL")


def downgrade() -> None:
    op.drop_constraint("fk_evaluado_area", "evaluado", type_="foreignkey")
    op.drop_column("evaluado", "area_id")
    op.drop_index(op.f("ix_area_tenant_id"), table_name="area")
    op.drop_table("area")
