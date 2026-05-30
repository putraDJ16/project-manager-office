from sqlalchemy import DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel, TimestampMixin


class AccountOtp(BaseModel, TimestampMixin):
    __tablename__ = "account_otps"
    __table_args__ = (
        Index("ix_account_otps_email_purpose", "email", "purpose"),
        Index("ix_account_otps_expires_at", "expires_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(180), nullable=False)
    purpose: Mapped[str] = mapped_column(String(40), nullable=False)
    code_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[object] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[object | None] = mapped_column(DateTime(timezone=True), nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
