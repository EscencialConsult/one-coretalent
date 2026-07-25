"""usuario.reset_token / reset_expira (recuperación de contraseña self-service)

Revision ID: a1b2c3d4e5f6
Revises: e6f7a8b9c0d1
Create Date: 2026-07-25 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "e6f7a8b9c0d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("usuario", sa.Column("reset_token", sa.String(length=64), nullable=True))
    op.add_column("usuario", sa.Column("reset_expira", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_usuario_reset_token", "usuario", ["reset_token"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_usuario_reset_token", table_name="usuario")
    op.drop_column("usuario", "reset_expira")
    op.drop_column("usuario", "reset_token")
