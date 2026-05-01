"""add project holidays and task mandays

Revision ID: e1f2a3b4c5d6
Revises: d2e3f4a5b6c7
Create Date: 2026-04-30 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "e1f2a3b4c5d6"
down_revision = "d2e3f4a5b6c7"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("tasks", schema=None) as batch_op:
        batch_op.add_column(sa.Column("mandays", sa.Integer(), nullable=True))

    op.create_table(
        "project_holidays",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("project_id", sa.String(length=32), nullable=False),
        sa.Column("holiday_date", sa.Date(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_id", "holiday_date", name="uq_project_holiday_date"),
    )
    op.create_index(op.f("ix_project_holidays_project_id"), "project_holidays", ["project_id"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_project_holidays_project_id"), table_name="project_holidays")
    op.drop_table("project_holidays")

    with op.batch_alter_table("tasks", schema=None) as batch_op:
        batch_op.drop_column("mandays")
