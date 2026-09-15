"""Reminder deliveries: one row per organization, kind and day a digest was sent, so a scheduled
job can run as often as it likes without repeating itself (Documents v2, Phase 10)."""

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import UUIDPrimaryKey


class ReminderDelivery(Base, UUIDPrimaryKey):
    __tablename__ = "reminder_deliveries"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    kind: Mapped[str] = mapped_column(String(64), nullable=False)
    sent_on: Mapped[date] = mapped_column(Date, nullable=False)
    recipients: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "organization_id", "kind", "sent_on", name="uq_reminder_deliveries_org_kind_day"
        ),
    )
