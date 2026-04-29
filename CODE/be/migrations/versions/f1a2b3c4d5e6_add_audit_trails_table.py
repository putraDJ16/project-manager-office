"""add audit trails table

Revision ID: f1a2b3c4d5e6
Revises: e7f8a9b0c1d2
Create Date: 2026-04-28 23:45:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f1a2b3c4d5e6"
down_revision = "e7f8a9b0c1d2"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "audit_trails",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("user_email", sa.String(length=180), nullable=True),
        sa.Column("action", sa.String(length=255), nullable=False),
        sa.Column("method", sa.String(length=10), nullable=False),
        sa.Column("path", sa.String(length=255), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=False),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.Column("request_query", sa.JSON(), nullable=True),
        sa.Column("request_body", sa.JSON(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_audit_trails_created_at"), "audit_trails", ["created_at"], unique=False)
    op.create_index(op.f("ix_audit_trails_method"), "audit_trails", ["method"], unique=False)
    op.create_index(op.f("ix_audit_trails_user_id"), "audit_trails", ["user_id"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_audit_trails_user_id"), table_name="audit_trails")
    op.drop_index(op.f("ix_audit_trails_method"), table_name="audit_trails")
    op.drop_index(op.f("ix_audit_trails_created_at"), table_name="audit_trails")
    op.drop_table("audit_trails")
