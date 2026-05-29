from datetime import date

from sqlalchemy import Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampMixin


class TaskTimesheet(BaseModel, TimestampMixin):
    __tablename__ = "task_timesheets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id: Mapped[str | None] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    work_date: Mapped[date] = mapped_column(Date(), nullable=False, index=True)
    hours_spent: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    task = relationship("Task", back_populates="timesheets")
    project = relationship("Project")
    user = relationship("User")
