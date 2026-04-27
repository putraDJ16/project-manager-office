"""set default created_by on tasks

Revision ID: d9c6c2f07d52
Revises: 8f12f1cce9aa
Create Date: 2026-04-11 11:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d9c6c2f07d52"
down_revision = "8f12f1cce9aa"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("UPDATE tasks SET created_by = 'System' WHERE created_by IS NULL")
    with op.batch_alter_table("tasks", schema=None) as batch_op:
        batch_op.alter_column(
            "created_by",
            existing_type=sa.String(length=150),
            nullable=False,
            server_default="System",
        )


def downgrade():
    with op.batch_alter_table("tasks", schema=None) as batch_op:
        batch_op.alter_column(
            "created_by",
            existing_type=sa.String(length=150),
            nullable=False,
            server_default=None,
        )
