from sqlalchemy import Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, utcnow


class UserEmailPreference(BaseModel):
    __tablename__ = "user_email_preferences"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    project_assignment: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    task_assignment: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    issue_events: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    meeting_invites: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    meeting_reminders: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    action_items: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    updated_at: Mapped[object] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="email_preferences")
