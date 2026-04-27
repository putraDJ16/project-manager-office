"""add task audit fields

Revision ID: 8f12f1cce9aa
Revises: 7662423bafaf
Create Date: 2026-04-11 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "8f12f1cce9aa"
down_revision = "7662423bafaf"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("tasks", schema=None) as batch_op:
        batch_op.add_column(sa.Column("created_by", sa.String(length=150), nullable=True))
        batch_op.add_column(sa.Column("phase_updated_at", sa.DateTime(timezone=True), nullable=True))

    op.execute("UPDATE tasks SET created_by = 'System' WHERE created_by IS NULL")

    with op.batch_alter_table("tasks", schema=None) as batch_op:
        batch_op.alter_column("created_by", existing_type=sa.String(length=150), nullable=False)


def downgrade():
    with op.batch_alter_table("tasks", schema=None) as batch_op:
        batch_op.drop_column("phase_updated_at")
        batch_op.drop_column("created_by")
