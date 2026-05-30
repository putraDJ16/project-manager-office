"""add default role flag

Revision ID: e9f0a1b2c3d4
Revises: e8f9a0b1c2d3
Create Date: 2026-05-31 09:30:00.000000

"""

import sqlalchemy as sa
from alembic import op


revision = "e9f0a1b2c3d4"
down_revision = "e8f9a0b1c2d3"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("roles", schema=None) as batch_op:
        batch_op.add_column(sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.false()))

    op.execute("UPDATE roles SET is_default = FALSE")
    op.execute(
        """
        UPDATE roles
        SET is_default = TRUE
        WHERE id = (
            SELECT id FROM roles
            WHERE lower(name) = 'viewer' AND status = 'Active'
            ORDER BY id
            LIMIT 1
        )
        """
    )
    op.execute(
        """
        UPDATE roles
        SET is_default = TRUE
        WHERE id = (
            SELECT id FROM roles
            WHERE status = 'Active'
            ORDER BY id
            LIMIT 1
        )
        AND NOT EXISTS (
            SELECT 1 FROM roles WHERE is_default = TRUE
        )
        """
    )

    with op.batch_alter_table("roles", schema=None) as batch_op:
        batch_op.alter_column("is_default", server_default=None)


def downgrade():
    with op.batch_alter_table("roles", schema=None) as batch_op:
        batch_op.drop_column("is_default")
