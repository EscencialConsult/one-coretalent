"""empresa: logo_url a Text + color_secundario

Revision ID: a8b7c6d5e4f3
Revises: f7a6b5c4d3e2
Create Date: 2026-07-02 11:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a8b7c6d5e4f3"
down_revision: Union[str, None] = "f7a6b5c4d3e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # logo_url puede guardar un data URI base64 → ampliar a Text.
    op.alter_column("empresa", "logo_url", type_=sa.Text(), existing_nullable=True)
    op.add_column(
        "empresa",
        sa.Column("color_secundario", sa.String(length=9), server_default=sa.text("'#6be1e3'"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("empresa", "color_secundario")
    op.alter_column("empresa", "logo_url", type_=sa.String(length=512), existing_nullable=True)
