"""add email outbox and preferences

Revision ID: a2b3c4d5e6f7
Revises: f4a5b6c7d8e9
Create Date: 2026-05-16 02:10:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "a2b3c4d5e6f7"
down_revision = "f4a5b6c7d8e9"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "email_outbox",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("to_email", sa.String(length=255), nullable=False),
        sa.Column("to_user_id", sa.Integer(), nullable=True),
        sa.Column("event_key", sa.String(length=60), nullable=False),
        sa.Column("entity_type", sa.String(length=40), nullable=True),
        sa.Column("entity_id", sa.String(length=64), nullable=True),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("body_html", sa.Text(), nullable=False),
        sa.Column("body_text", sa.Text(), nullable=True),
        sa.Column("headers_json", sa.Text(), nullable=True),
        sa.Column("ical", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="Queued"),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["to_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_email_outbox_status_scheduled_at", "email_outbox", ["status", "scheduled_at"])
    op.create_index("ix_email_outbox_to_user_id", "email_outbox", ["to_user_id"])
    op.create_index("ix_email_outbox_event_key", "email_outbox", ["event_key"])

    op.create_table(
        "user_email_preferences",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("project_assignment", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("task_assignment", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("issue_events", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("meeting_invites", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("meeting_reminders", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("action_items", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )


def downgrade():
    op.drop_table("user_email_preferences")
    op.drop_index("ix_email_outbox_event_key", table_name="email_outbox")
    op.drop_index("ix_email_outbox_to_user_id", table_name="email_outbox")
    op.drop_index("ix_email_outbox_status_scheduled_at", table_name="email_outbox")
    op.drop_table("email_outbox")
