"""add account otps

Revision ID: f0a1b2c3d4e5
Revises: e9f0a1b2c3d4
Create Date: 2026-05-31 10:15:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "f0a1b2c3d4e5"
down_revision = "e9f0a1b2c3d4"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "account_otps",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=180), nullable=False),
        sa.Column("purpose", sa.String(length=40), nullable=False),
        sa.Column("code_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_account_otps_email_purpose", "account_otps", ["email", "purpose"])
    op.create_index("ix_account_otps_expires_at", "account_otps", ["expires_at"])


def downgrade():
    op.drop_index("ix_account_otps_expires_at", table_name="account_otps")
    op.drop_index("ix_account_otps_email_purpose", table_name="account_otps")
    op.drop_table("account_otps")
