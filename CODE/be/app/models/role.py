from sqlalchemy import JSON, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampMixin
from app.models.constants import ROLE_STATUS


class Role(BaseModel, TimestampMixin):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Enum(*ROLE_STATUS, name="role_status"), nullable=False, default="Active")
    permissions: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    employees = relationship("Employee", back_populates="role")
    users = relationship("User", back_populates="role")
