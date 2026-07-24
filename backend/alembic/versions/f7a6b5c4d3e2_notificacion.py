"""notificacion (avisos in-app del admin de empresa)

Revision ID: f7a6b5c4d3e2
Revises: e5f4a3b2c1d0
Create Date: 2026-07-02 09:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f7a6b5c4d3e2"
down_revision: Union[str, None] = "e5f4a3b2c1d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notificacion",
        sa.Column("tipo", sa.String(length=40), nullable=False),
        sa.Column("mensaje", sa.String(length=300), nullable=False),
        sa.Column("link", sa.String(length=200), nullable=True),
        sa.Column("leido", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["empresa.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notificacion_tenant_id"), "notificacion", ["tenant_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_notificacion_tenant_id"), table_name="notificacion")
    op.drop_table("notificacion")
