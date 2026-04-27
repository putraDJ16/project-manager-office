from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampMixin
from app.models.constants import EMPLOYEE_STATUS


class Employee(BaseModel, TimestampMixin):
    __tablename__ = "employees"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    nip: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(180), nullable=False, unique=True)
    organization: Mapped[str] = mapped_column(String(180), nullable=False)
    unit_organization: Mapped[str] = mapped_column(String(180), nullable=False)
    position: Mapped[str] = mapped_column(String(180), nullable=False)
    role_id: Mapped[str] = mapped_column(ForeignKey("roles.id"), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum(*EMPLOYEE_STATUS, name="employee_status"), nullable=False, default="Active"
    )

    role = relationship("Role", back_populates="employees")
