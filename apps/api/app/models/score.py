"""Score snapshots (decision D10).

The score itself is always computed live from the organization's records; a snapshot is the
persisted explanation at a point in time so trends and deltas are possible. Old snapshots are never
recomputed — `score_version` labels the formula that produced them.
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, SmallInteger, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import UUIDPrimaryKey


class ScoreSnapshot(Base, UUIDPrimaryKey):
    __tablename__ = "score_snapshots"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    score_version: Mapped[str] = mapped_column(String(16), nullable=False)
    preliminary: Mapped[bool] = mapped_column(Boolean, nullable=False)
    trigger: Mapped[str] = mapped_column(String(64), nullable=False)
    breakdown: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        UniqueConstraint("organization_id", "id", name="uq_score_snapshots_org_id"),
        Index("ix_score_snapshots_org_computed", "organization_id", "computed_at"),
    )
