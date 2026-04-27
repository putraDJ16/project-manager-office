from sqlalchemy import JSON, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampMixin
from app.models.constants import ISSUE_SEVERITY, ISSUE_STATUS


class Issue(BaseModel, TimestampMixin):
    __tablename__ = "issues"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    severity: Mapped[str] = mapped_column(
        Enum(*ISSUE_SEVERITY, name="issue_severity"), nullable=False, default="Major"
    )
    status: Mapped[str] = mapped_column(Enum(*ISSUE_STATUS, name="issue_status"), nullable=False, default="Open")
    reporter: Mapped[str] = mapped_column(String(140), nullable=False)
    assignee: Mapped[str | None] = mapped_column(String(140), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="Belum ada deskripsi tambahan.")
    module: Mapped[str] = mapped_column(String(180), nullable=False, default="General")
    environment: Mapped[str] = mapped_column(String(180), nullable=False, default="Unspecified")
    reproduction_steps: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    actual_result: Mapped[str] = mapped_column(Text, nullable=False, default="Belum diisi")
    expected_result: Mapped[str] = mapped_column(Text, nullable=False, default="Belum diisi")
    attachments: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    project = relationship("Project")
