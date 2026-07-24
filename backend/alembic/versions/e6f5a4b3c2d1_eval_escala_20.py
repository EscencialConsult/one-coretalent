"""eval escala VARCHAR(20) (para 'satisfaccion')

Revision ID: e6f5a4b3c2d1
Revises: d2e3f4a5b6c7
Create Date: 2026-07-07 20:10:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e6f5a4b3c2d1"
down_revision: Union[str, None] = "d2e3f4a5b6c7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 'satisfaccion' (12 chars) no entra en VARCHAR(10); ampliamos a 20.
    op.alter_column("eval_formulario", "escala", existing_type=sa.String(length=10),
                    type_=sa.String(length=20), existing_nullable=False)
    op.alter_column("eval_campania", "escala", existing_type=sa.String(length=10),
                    type_=sa.String(length=20), existing_nullable=False)


def downgrade() -> None:
    op.alter_column("eval_campania", "escala", existing_type=sa.String(length=20),
                    type_=sa.String(length=10), existing_nullable=False)
    op.alter_column("eval_formulario", "escala", existing_type=sa.String(length=20),
                    type_=sa.String(length=10), existing_nullable=False)
