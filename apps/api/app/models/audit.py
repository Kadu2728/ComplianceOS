import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import UUIDPrimaryKey


class AuditLog(Base, UUIDPrimaryKey):
    """Append-only. No UPDATE/DELETE path exists in the application; the migration also
    revokes those privileges from the application role when one is configured (Phase 2b).
    `organization_id` is NULL only for user-level auth events (login, reset)."""

    __tablename__ = "audit_logs"

    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    actor_membership_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(64))
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    data: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    request_id: Mapped[str | None] = mapped_column(String(128))
    # Set by `services.audit.record` (strictly increasing per process); the server default only
    # covers rows inserted outside the application.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        Index("ix_audit_logs_org_created", "organization_id", "created_at"),
        Index("ix_audit_logs_org_entity", "organization_id", "entity_type", "entity_id"),
    )
