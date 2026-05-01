from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampMixin


class ProjectHoliday(BaseModel, TimestampMixin):
    __tablename__ = "project_holidays"
    __table_args__ = (UniqueConstraint("project_id", "holiday_date", name="uq_project_holiday_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False, index=True)
    holiday_date: Mapped[date] = mapped_column(Date(), nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)

    project = relationship("Project", back_populates="holidays")
