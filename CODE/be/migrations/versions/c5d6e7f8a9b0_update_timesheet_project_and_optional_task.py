"""update timesheet project and optional task

Revision ID: c5d6e7f8a9b0
Revises: b4c5d6e7f8a9
Create Date: 2026-05-29 18:10:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "c5d6e7f8a9b0"
down_revision = "b4c5d6e7f8a9"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("task_timesheets", schema=None) as batch_op:
        batch_op.add_column(sa.Column("project_id", sa.String(length=32), nullable=True))

    op.execute(
        """
        UPDATE task_timesheets
        SET project_id = (
            SELECT tasks.project_id
            FROM tasks
            WHERE tasks.id = task_timesheets.task_id
        )
        """
    )

    with op.batch_alter_table("task_timesheets", schema=None) as batch_op:
        batch_op.alter_column("project_id", existing_type=sa.String(length=32), nullable=False)
        batch_op.alter_column("task_id", existing_type=sa.String(length=32), nullable=True)
        batch_op.create_foreign_key(
            "fk_task_timesheets_project_id_projects",
            "projects",
            ["project_id"],
            ["id"],
            ondelete="CASCADE",
        )
        batch_op.drop_constraint("uq_task_timesheets_user_task_work_date", type_="unique")
        batch_op.create_unique_constraint(
            "uq_task_timesheets_scope_work_date",
            ["user_id", "project_id", "task_id", "work_date"],
        )

    op.create_index(op.f("ix_task_timesheets_project_id"), "task_timesheets", ["project_id"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_task_timesheets_project_id"), table_name="task_timesheets")
    with op.batch_alter_table("task_timesheets", schema=None) as batch_op:
        batch_op.drop_constraint("uq_task_timesheets_scope_work_date", type_="unique")
        batch_op.create_unique_constraint(
            "uq_task_timesheets_user_task_work_date",
            ["user_id", "task_id", "work_date"],
        )
        batch_op.drop_constraint("fk_task_timesheets_project_id_projects", type_="foreignkey")
        batch_op.alter_column("task_id", existing_type=sa.String(length=32), nullable=False)
        batch_op.drop_column("project_id")
