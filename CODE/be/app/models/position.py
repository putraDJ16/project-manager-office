from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel, TimestampMixin
from app.models.constants import ROLE_STATUS


class Position(BaseModel, TimestampMixin):
    __tablename__ = "positions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(180), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(
        Enum(*ROLE_STATUS, name="master_reference_status"), nullable=False, default="Active"
    )
