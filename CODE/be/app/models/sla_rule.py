from sqlalchemy import Boolean, Enum, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel, TimestampMixin
from app.models.constants import ISSUE_SEVERITY


class SlaRule(BaseModel, TimestampMixin):
    __tablename__ = "sla_rules"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    severity: Mapped[str] = mapped_column(
        Enum(*ISSUE_SEVERITY, name="sla_severity"), nullable=False, unique=True
    )
    target_hours: Mapped[int] = mapped_column(Integer, nullable=False, default=8)
    auto_escalate: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    escalation_delay_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
