"""Control Graph (decision D27): Risk → Control → Action → Evidence → Document.

A control is the organization's own safeguard (a policy, a procedure, a technical measure). It
mitigates one or more risks, is implemented or improved by actions, is proven by evidence and may
be formalized by a document. Same tenant pattern as every other domain table: composite foreign
keys `(organization_id, <id>)` so a cross-organization link is impossible at the database level.
"""

import enum
import uuid
from datetime import date

from sqlalchemy import (
    Date,
    Enum,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.domain import RiskCategory
from app.models.mixins import Timestamps, UUIDPrimaryKey


def _enum(cls: type[enum.StrEnum], name: str, **kw: object) -> Enum:
    return Enum(cls, name=name, values_callable=lambda e: [m.value for m in e], **kw)


class ControlKind(enum.StrEnum):
    PREVENTIVO = "preventivo"
    DETECTIVO = "detectivo"
    CORRETIVO = "corretivo"


class ControlStatus(enum.StrEnum):
    """Maturity ladder. `verificado` requires evidence linked to the control (service rule)."""

    PLANEJADO = "planejado"
    PARCIAL = "parcial"
    IMPLEMENTADO = "implementado"
    VERIFICADO = "verificado"
    INATIVO = "inativo"


# Coverage credit a control gives to the risks it mitigates (Score v2, factor K — decision D31).
CONTROL_COVERAGE: dict[ControlStatus, float] = {
    ControlStatus.PLANEJADO: 0.0,
    ControlStatus.PARCIAL: 0.5,
    ControlStatus.IMPLEMENTADO: 1.0,
    ControlStatus.VERIFICADO: 1.0,
    ControlStatus.INATIVO: 0.0,
}


class Control(Base, UUIDPrimaryKey, Timestamps):
    __tablename__ = "controls"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[RiskCategory] = mapped_column(
        _enum(RiskCategory, "risk_category", create_type=False), nullable=False
    )
    kind: Mapped[ControlKind] = mapped_column(
        _enum(ControlKind, "control_kind"),
        nullable=False,
        server_default=ControlKind.PREVENTIVO.value,
    )
    status: Mapped[ControlStatus] = mapped_column(
        _enum(ControlStatus, "control_status"),
        nullable=False,
        server_default=ControlStatus.PLANEJADO.value,
    )
    # Key in the versioned catalogue (app/content/controls_v1.json); NULL for custom controls.
    template_code: Mapped[str | None] = mapped_column(String(32))
    owner_membership_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    created_by_membership_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    # The policy / procedure that formalizes the control (Document, same organization).
    document_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    review_date: Mapped[date | None] = mapped_column(Date)

    owner = relationship(
        "Membership",
        primaryjoin="and_(Control.owner_membership_id==Membership.id, "
        "Control.organization_id==Membership.organization_id)",
        foreign_keys=[owner_membership_id],
        viewonly=True,
        lazy="joined",
    )
    document = relationship(
        "Document",
        primaryjoin="and_(Control.document_id==Document.id, "
        "Control.organization_id==Document.organization_id)",
        foreign_keys=[document_id],
        viewonly=True,
        lazy="joined",
    )

    __table_args__ = (
        UniqueConstraint("organization_id", "id", name="uq_controls_org_id"),
        ForeignKeyConstraint(
            ["organization_id", "owner_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_controls_owner_membership",
            ondelete="SET NULL (owner_membership_id)",
        ),
        ForeignKeyConstraint(
            ["organization_id", "created_by_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_controls_created_by_membership",
            ondelete="SET NULL (created_by_membership_id)",
        ),
        ForeignKeyConstraint(
            ["organization_id", "document_id"],
            ["documents.organization_id", "documents.id"],
            name="fk_controls_document",
            ondelete="SET NULL (document_id)",
        ),
        Index("ix_controls_org_status", "organization_id", "status"),
        Index("ix_controls_org_template", "organization_id", "template_code"),
        Index("ix_controls_org_owner", "organization_id", "owner_membership_id"),
    )


class RiskControl(Base, UUIDPrimaryKey):
    """A control mitigates a risk. Both sides are composite foreign keys, so the pair is always
    within one organization; the pair itself is unique."""

    __tablename__ = "risk_controls"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    risk_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    control_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)

    __table_args__ = (
        UniqueConstraint("organization_id", "risk_id", "control_id", name="uq_risk_controls_pair"),
        ForeignKeyConstraint(
            ["organization_id", "risk_id"],
            ["risks.organization_id", "risks.id"],
            name="fk_risk_controls_risk",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["organization_id", "control_id"],
            ["controls.organization_id", "controls.id"],
            name="fk_risk_controls_control",
            ondelete="CASCADE",
        ),
        Index("ix_risk_controls_org_control", "organization_id", "control_id"),
    )
