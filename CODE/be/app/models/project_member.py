from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, utcnow


class ProjectMember(BaseModel):
    __tablename__ = "project_members"

    project_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True
    )
    employee_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("employees.id", ondelete="CASCADE"), primary_key=True
    )
    joined_at: Mapped[str] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    project = relationship("Project", back_populates="members")
    employee = relationship("Employee", back_populates="project_memberships")
