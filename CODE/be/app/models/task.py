from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampMixin
from app.models.constants import TASK_PRIORITY


class Task(BaseModel, TimestampMixin):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    priority: Mapped[str] = mapped_column(
        Enum(*TASK_PRIORITY, name="task_priority"), nullable=False, default="Medium"
    )
    assignee: Mapped[str] = mapped_column(String(64), nullable=False)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False, index=True)
    phase_id: Mapped[str] = mapped_column(ForeignKey("phases.id"), nullable=False, index=True)
    created_by: Mapped[str] = mapped_column(
        String(150), nullable=False, default="System", server_default="System"
    )
    phase_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    progress_percentage: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    start_date: Mapped[date | None] = mapped_column(Date(), nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date(), nullable=True)

    project = relationship("Project", back_populates="tasks")
    phase = relationship("Phase", back_populates="tasks")
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")
