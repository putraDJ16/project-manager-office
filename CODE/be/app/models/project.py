from sqlalchemy import Date, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampMixin
from app.models.constants import PROJECT_PRIORITY, PROJECT_STATUS


class Project(BaseModel, TimestampMixin):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum(*PROJECT_STATUS, name="project_status"), nullable=False, default="Planning"
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority: Mapped[str | None] = mapped_column(
        Enum(*PROJECT_PRIORITY, name="project_priority"), nullable=True
    )
    manager_id: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    start_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[str | None] = mapped_column(Date, nullable=True)

    phases = relationship("Phase", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    attachment_folders = relationship(
        "ProjectAttachmentFolder", back_populates="project", cascade="all, delete-orphan"
    )
    attachment_files = relationship(
        "ProjectAttachmentFile", back_populates="project", cascade="all, delete-orphan"
    )
    manager = relationship("Employee", foreign_keys=[manager_id])
