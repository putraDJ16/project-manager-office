from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampMixin, utcnow


class EmailOutbox(BaseModel, TimestampMixin):
    __tablename__ = "email_outbox"
    __table_args__ = (
        Index("ix_email_outbox_status_scheduled_at", "status", "scheduled_at"),
        Index("ix_email_outbox_event_key", "event_key"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    to_email: Mapped[str] = mapped_column(String(255), nullable=False)
    to_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    event_key: Mapped[str] = mapped_column(String(60), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(40), nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    body_html: Mapped[str] = mapped_column(Text, nullable=False)
    body_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    headers_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    ical: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Queued")
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    scheduled_at: Mapped[object] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    sent_at: Mapped[object | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User")
