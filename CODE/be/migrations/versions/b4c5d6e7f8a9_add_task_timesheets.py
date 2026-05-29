"""add task timesheets

Revision ID: b4c5d6e7f8a9
Revises: a2b3c4d5e6f7
Create Date: 2026-05-29 16:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "b4c5d6e7f8a9"
down_revision = "a2b3c4d5e6f7"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "task_timesheets",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("task_id", sa.String(length=32), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("work_date", sa.Date(), nullable=False),
        sa.Column("hours_spent", sa.Float(), nullable=False),
        sa.Column("notes", sa.String(length=1000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "task_id", "work_date", name="uq_task_timesheets_user_task_work_date"),
    )
    op.create_index(op.f("ix_task_timesheets_task_id"), "task_timesheets", ["task_id"], unique=False)
    op.create_index(op.f("ix_task_timesheets_user_id"), "task_timesheets", ["user_id"], unique=False)
    op.create_index(op.f("ix_task_timesheets_work_date"), "task_timesheets", ["work_date"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_task_timesheets_work_date"), table_name="task_timesheets")
    op.drop_index(op.f("ix_task_timesheets_user_id"), table_name="task_timesheets")
    op.drop_index(op.f("ix_task_timesheets_task_id"), table_name="task_timesheets")
    op.drop_table("task_timesheets")
