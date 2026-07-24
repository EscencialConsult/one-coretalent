"""evaluado.tipo (colaborador | postulante)

Revision ID: c1d2e3f4a5b6
Revises: c0d1e2f3a4b5
Create Date: 2026-07-02 17:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, None] = "c0d1e2f3a4b5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "evaluado",
        sa.Column("tipo", sa.String(length=16), server_default=sa.text("'colaborador'"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("evaluado", "tipo")
