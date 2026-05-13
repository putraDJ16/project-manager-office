from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampMixin


class ProjectMeeting(BaseModel, TimestampMixin):
    __tablename__ = "project_meetings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    meeting_type: Mapped[str] = mapped_column(String(20), nullable=False)
    meeting_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    start_datetime: Mapped[object] = mapped_column(DateTime(timezone=True), nullable=False)
    end_datetime: Mapped[object] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Scheduled")
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    project = relationship("Project", back_populates="meetings")
    creator = relationship("User", foreign_keys=[created_by])
    attendees = relationship("ProjectMeetingAttendee", back_populates="meeting", cascade="all, delete-orphan")
    note = relationship("ProjectMeetingNote", back_populates="meeting", cascade="all, delete-orphan", uselist=False)
    files = relationship("ProjectMeetingFile", back_populates="meeting", cascade="all, delete-orphan")


class ProjectMeetingAttendee(BaseModel):
    __tablename__ = "project_meeting_attendees"

    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("project_meetings.id", ondelete="CASCADE"), primary_key=True
    )
    employee_id: Mapped[str] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), primary_key=True)
    rsvp_status: Mapped[str] = mapped_column(String(20), nullable=False, default="Pending")
    attended: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    meeting = relationship("ProjectMeeting", back_populates="attendees")
    employee = relationship("Employee")
