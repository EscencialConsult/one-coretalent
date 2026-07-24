"""empresa_test (tests habilitados por empresa)

Revision ID: b2f1a9c4d7e3
Revises: 9ef9f6d69f91
Create Date: 2026-06-30 15:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b2f1a9c4d7e3"
down_revision: Union[str, None] = "9ef9f6d69f91"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "empresa_test",
        sa.Column("test_slug", sa.String(length=64), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["empresa.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "test_slug", name="uq_empresa_test"),
    )
    op.create_index(op.f("ix_empresa_test_tenant_id"), "empresa_test", ["tenant_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_empresa_test_tenant_id"), table_name="empresa_test")
    op.drop_table("empresa_test")
