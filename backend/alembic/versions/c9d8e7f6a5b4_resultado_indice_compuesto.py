"""resultado: índice compuesto (persona_id, test_slug, created_at)

Cubre el hot path de _resultado_global/finalizar_evaluacion, que busca el resultado
más reciente de una persona para un test puntual en cada asignación/finalización.

Revision ID: c9d8e7f6a5b4
Revises: a1b2c3d4e5f6
Create Date: 2026-07-27 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "c9d8e7f6a5b4"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_resultado_persona_test_created",
        "resultado",
        ["persona_id", "test_slug", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_resultado_persona_test_created", table_name="resultado")
