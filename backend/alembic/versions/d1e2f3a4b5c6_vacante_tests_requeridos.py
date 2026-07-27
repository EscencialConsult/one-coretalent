"""vacante: agrega tests_requeridos (asignación automática al postular)

Reemplaza la asignación manual uno por uno: la empresa configura qué tests
requiere el puesto una sola vez, al crear/editar la vacante, y se asignan
solos a cada postulación nueva.

Revision ID: d1e2f3a4b5c6
Revises: c9d8e7f6a5b4
Create Date: 2026-07-27 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, None] = "c9d8e7f6a5b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "vacante",
        sa.Column("tests_requeridos", sa.JSON(), nullable=False, server_default="[]"),
    )
    op.alter_column("vacante", "tests_requeridos", server_default=None)


def downgrade() -> None:
    op.drop_column("vacante", "tests_requeridos")
