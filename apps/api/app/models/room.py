"""Compliance Room (decision D36): the organization's shareable surface.

One room per organization, disabled by default. What it shows is decided record by record
(`documents.shared_in_room`, `controls.shared_in_room`) and reached only through time-boxed links
whose tokens are stored hashed. Boundaries: docs/security/compliance-room-threat-model.md.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import Timestamps, UUIDPrimaryKey

LINK_MAX_DAYS = 90
LINK_DEFAULT_DAYS = 30
ACTIVE_LINKS_MAX = 20


class ComplianceRoom(Base, UUIDPrimaryKey, Timestamps):
    __tablename__ = "compliance_rooms"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    title: Mapped[str | None] = mapped_column(String(120))
    intro: Mapped[str | None] = mapped_column(Text)
    show_score: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    show_controls: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    contact_email: Mapped[str | None] = mapped_column(String(254))

    __table_args__ = (UniqueConstraint("organization_id", "id", name="uq_compliance_rooms_org_id"),)


class RoomLink(Base, UUIDPrimaryKey, Timestamps):
    __tablename__ = "room_links"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    room_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    label: Mapped[str] = mapped_column(String(80), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_by_membership_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    view_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    last_viewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    room = relationship(
        "ComplianceRoom",
        primaryjoin="RoomLink.room_id==ComplianceRoom.id",
        foreign_keys=[room_id],
        viewonly=True,
        lazy="joined",
    )

    __table_args__ = (
        ForeignKeyConstraint(
            ["organization_id", "room_id"],
            ["compliance_rooms.organization_id", "compliance_rooms.id"],
            name="fk_room_links_room",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["organization_id", "created_by_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_room_links_created_by_membership",
            ondelete="SET NULL (created_by_membership_id)",
        ),
        Index("ix_room_links_org_room", "organization_id", "room_id"),
    )

    def active(self, now: datetime) -> bool:
        return self.revoked_at is None and self.expires_at > now
