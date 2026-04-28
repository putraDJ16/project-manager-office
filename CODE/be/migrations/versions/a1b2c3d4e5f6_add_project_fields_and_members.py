"""add project fields and project members table

Revision ID: a1b2c3d4e5f6
Revises: d9c6c2f07d52
Create Date: 2026-04-28 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "d9c6c2f07d52"
branch_labels = None
depends_on = None


def upgrade():
    project_priority_enum = sa.Enum("Low", "Medium", "High", "Critical", name="project_priority")
    project_priority_enum.create(op.get_bind(), checkfirst=True)

    # Add new columns to projects table
    with op.batch_alter_table("projects", schema=None) as batch_op:
        batch_op.add_column(sa.Column("description", sa.Text(), nullable=True))
        batch_op.add_column(
            sa.Column(
                "priority",
                project_priority_enum,
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "manager_id",
                sa.String(length=32),
                sa.ForeignKey("employees.id", ondelete="SET NULL"),
                nullable=True,
            )
        )
        batch_op.add_column(sa.Column("start_date", sa.Date(), nullable=True))
        batch_op.add_column(sa.Column("end_date", sa.Date(), nullable=True))

    # Create project_members table
    op.create_table(
        "project_members",
        sa.Column("project_id", sa.String(length=32), sa.ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("employee_id", sa.String(length=32), sa.ForeignKey("employees.id", ondelete="CASCADE"), primary_key=True),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )


def downgrade():
    op.drop_table("project_members")

    with op.batch_alter_table("projects", schema=None) as batch_op:
        batch_op.drop_column("end_date")
        batch_op.drop_column("start_date")
        batch_op.drop_column("manager_id")
        batch_op.drop_column("priority")
        batch_op.drop_column("description")

    sa.Enum("Low", "Medium", "High", "Critical", name="project_priority").drop(
        op.get_bind(), checkfirst=True
    )
