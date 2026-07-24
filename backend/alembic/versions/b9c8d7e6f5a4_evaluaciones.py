"""módulo de evaluaciones (formularios, competencias, preguntas, campañas, evaluadores)

Revision ID: b9c8d7e6f5a4
Revises: a8b7c6d5e4f3
Create Date: 2026-07-02 13:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b9c8d7e6f5a4"
down_revision: Union[str, None] = "a8b7c6d5e4f3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "eval_formulario",
        sa.Column("tenant_id", sa.Uuid(), nullable=True),
        sa.Column("nombre", sa.String(length=160), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column("escala", sa.String(length=10), nullable=False),
        sa.Column("es_plantilla", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["empresa.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_eval_formulario_tenant_id"), "eval_formulario", ["tenant_id"], unique=False)

    op.create_table(
        "eval_competencia",
        sa.Column("formulario_id", sa.Uuid(), nullable=False),
        sa.Column("nombre", sa.String(length=160), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("orden", sa.Integer(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["formulario_id"], ["eval_formulario.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_eval_competencia_formulario_id"), "eval_competencia", ["formulario_id"], unique=False)

    op.create_table(
        "eval_pregunta",
        sa.Column("competencia_id", sa.Uuid(), nullable=False),
        sa.Column("texto", sa.Text(), nullable=False),
        sa.Column("orden", sa.Integer(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["competencia_id"], ["eval_competencia.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_eval_pregunta_competencia_id"), "eval_pregunta", ["competencia_id"], unique=False)

    op.create_table(
        "eval_campania",
        sa.Column("nombre", sa.String(length=160), nullable=False),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column("escala", sa.String(length=10), nullable=False),
        sa.Column("estructura", sa.JSON(), nullable=False),
        sa.Column("formulario_id", sa.Uuid(), nullable=True),
        sa.Column("sujeto_nombre", sa.String(length=200), nullable=False),
        sa.Column("sujeto_evaluado_id", sa.Uuid(), nullable=True),
        sa.Column("estado", sa.String(length=12), nullable=False),
        sa.Column("anonimato_min", sa.Integer(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["formulario_id"], ["eval_formulario.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["sujeto_evaluado_id"], ["evaluado.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["tenant_id"], ["empresa.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_eval_campania_tenant_id"), "eval_campania", ["tenant_id"], unique=False)

    op.create_table(
        "eval_evaluador",
        sa.Column("campania_id", sa.Uuid(), nullable=False),
        sa.Column("relacion", sa.String(length=12), nullable=False),
        sa.Column("nombre", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("evaluado_id", sa.Uuid(), nullable=True),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("estado", sa.String(length=12), nullable=False),
        sa.Column("respuestas", sa.JSON(), nullable=True),
        sa.Column("fecha_respuesta", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["campania_id"], ["eval_campania.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["evaluado_id"], ["evaluado.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["tenant_id"], ["empresa.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_eval_evaluador_campania_id"), "eval_evaluador", ["campania_id"], unique=False)
    op.create_index(op.f("ix_eval_evaluador_tenant_id"), "eval_evaluador", ["tenant_id"], unique=False)
    op.create_index(op.f("ix_eval_evaluador_token"), "eval_evaluador", ["token"], unique=True)


def downgrade() -> None:
    op.drop_table("eval_evaluador")
    op.drop_table("eval_campania")
    op.drop_table("eval_pregunta")
    op.drop_table("eval_competencia")
    op.drop_table("eval_formulario")
