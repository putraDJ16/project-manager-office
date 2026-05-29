"""add user onboarding completed

Revision ID: e8f9a0b1c2d3
Revises: d6e7f8a9b0c1
Create Date: 2026-05-29 21:00:00.000000

"""

import sqlalchemy as sa
from alembic import op


revision = "e8f9a0b1c2d3"
down_revision = "d6e7f8a9b0c1"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(sa.Column("onboarding_completed", sa.Boolean(), nullable=False, server_default=sa.true()))

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.alter_column("onboarding_completed", server_default=sa.false())


def downgrade():
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_column("onboarding_completed")
