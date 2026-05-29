"""allow multiple timesheet entries

Revision ID: d6e7f8a9b0c1
Revises: c5d6e7f8a9b0
Create Date: 2026-05-29 20:30:00.000000

"""

from alembic import op


revision = "d6e7f8a9b0c1"
down_revision = "c5d6e7f8a9b0"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("task_timesheets", schema=None) as batch_op:
        batch_op.drop_constraint("uq_task_timesheets_scope_work_date", type_="unique")


def downgrade():
    with op.batch_alter_table("task_timesheets", schema=None) as batch_op:
        batch_op.create_unique_constraint(
            "uq_task_timesheets_scope_work_date",
            ["user_id", "project_id", "task_id", "work_date"],
        )
