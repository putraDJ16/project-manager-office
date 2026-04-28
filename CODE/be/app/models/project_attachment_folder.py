from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampMixin


class ProjectAttachmentFolder(BaseModel, TimestampMixin):
    __tablename__ = "project_attachment_folders"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    parent_id: Mapped[str | None] = mapped_column(
        ForeignKey("project_attachment_folders.id", ondelete="CASCADE"), nullable=True
    )

    project = relationship("Project", back_populates="attachment_folders")
    parent = relationship("ProjectAttachmentFolder", remote_side=[id], back_populates="children")
    children = relationship("ProjectAttachmentFolder", back_populates="parent", cascade="all, delete-orphan")
    files = relationship("ProjectAttachmentFile", back_populates="folder", cascade="all, delete-orphan")
