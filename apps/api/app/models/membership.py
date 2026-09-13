import uuid

from sqlalchemy import Enum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.permissions import Role
from app.db.base import Base
from app.models.mixins import Timestamps, UUIDPrimaryKey


class Membership(Base, UUIDPrimaryKey, Timestamps):
    """User ↔ Organization with a role. Owners of domain records point here, not to users,
    so a person leaving the organization never leaves dangling cross-tenant references.
    """

    __tablename__ = "memberships"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[Role] = mapped_column(
        Enum(Role, name="membership_role", values_callable=lambda e: [r.value for r in e]),
        nullable=False,
    )

    user = relationship("User", lazy="joined")
    organization = relationship("Organization", lazy="joined")

    __table_args__ = (
        UniqueConstraint("user_id", "organization_id", name="uq_memberships_user_org"),
        # Composite target for tenant-safe foreign keys from child tables (Diagnostic §7).
        UniqueConstraint("organization_id", "id", name="uq_memberships_org_id"),
    )
