"""empresa_test.habilitado (deshabilitar sin sacar del alcance)

Revision ID: e5f4a3b2c1d0
Revises: d4e3f2a1b0c9
Create Date: 2026-07-01 10:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e5f4a3b2c1d0"
down_revision: Union[str, None] = "d4e3f2a1b0c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "empresa_test",
        sa.Column("habilitado", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )


def downgrade() -> None:
    op.drop_column("empresa_test", "habilitado")
