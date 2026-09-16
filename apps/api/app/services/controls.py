"""Controls and the Control Graph edges (decision D27).

Same rules as risks: managers create/edit/delete/link; the control's owner may edit it (not
reassign); everyone reads. `verificado` needs at least one evidence linked to the control — a
control is verified by proof, not by declaration (brand §6 "evidence over claims"). Every change
is audited in the caller's transaction.
"""

import uuid
from datetime import date
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.permissions import has_permission
from app.models.control import Control, ControlKind, ControlStatus, RiskControl
from app.models.document import Document
from app.models.domain import Action, Evidence, Risk, RiskCategory
from app.models.membership import Membership
from app.services.domain import (
    DomainRuleViolation,
    _audit,
    _plain,
    _reload_owner,
    _validate_owner,
    get_risk,
)

# Maturity ladder order (for display and for "improving" checks). `inativo` sits outside.
LADDER = [
    ControlStatus.PLANEJADO,
    ControlStatus.PARCIAL,
    ControlStatus.IMPLEMENTADO,
    ControlStatus.VERIFICADO,
]


def get(db: Session, actor: Membership, control_id: uuid.UUID) -> Control:
    control = db.scalar(
        select(Control).where(
            Control.id == control_id, Control.organization_id == actor.organization_id
        )
    )
    if control is None:
        raise DomainRuleViolation("Not Found", 404)
    return control


def _require_edit(actor: Membership, control: Control) -> None:
    if has_permission(actor.role, "control.update_any"):
        return
    if has_permission(actor.role, "control.update_assigned") and (
        control.owner_membership_id == actor.id
    ):
        return
    raise DomainRuleViolation("You can only change controls assigned to you.", 403)


def _validate_document(db: Session, actor: Membership, document_id: uuid.UUID | None) -> None:
    if document_id is None:
        return
    exists = db.scalar(
        select(Document.id).where(
            Document.id == document_id, Document.organization_id == actor.organization_id
        )
    )
    if exists is None:
        raise DomainRuleViolation("Document must belong to this organization.", 422)


def evidence_count(db: Session, organization_id: uuid.UUID, control_id: uuid.UUID) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(Evidence)
            .where(Evidence.organization_id == organization_id, Evidence.control_id == control_id)
        )
        or 0
    )


def create(
    db: Session,
    actor: Membership,
    *,
    title: str,
    category: RiskCategory,
    description: str | None = None,
    kind: ControlKind = ControlKind.PREVENTIVO,
    status: ControlStatus = ControlStatus.PLANEJADO,
    owner_membership_id: uuid.UUID | None = None,
    document_id: uuid.UUID | None = None,
    review_date: date | None = None,
    template_code: str | None = None,
) -> Control:
    if not has_permission(actor.role, "control.create"):
        raise DomainRuleViolation("You do not have permission to create controls.", 403)
    if status == ControlStatus.VERIFICADO:
        raise DomainRuleViolation("Create the control first, then attach proof to verify it.")
    _validate_owner(db, actor, owner_membership_id)
    _validate_document(db, actor, document_id)
    control = Control(
        organization_id=actor.organization_id,
        title=title,
        description=description,
        category=category,
        kind=kind,
        status=status,
        owner_membership_id=owner_membership_id,
        document_id=document_id,
        review_date=review_date,
        template_code=template_code,
        created_by_membership_id=actor.id,
    )
    db.add(control)
    db.flush()
    _audit(
        db,
        actor,
        "control.created",
        "control",
        control.id,
        {"title": title, "status": status.value, "template_code": template_code},
    )
    return control


def update(
    db: Session, actor: Membership, control_id: uuid.UUID, changes: dict[str, Any]
) -> Control:
    control = get(db, actor, control_id)
    _require_edit(actor, control)
    if "owner_membership_id" in changes:
        if not has_permission(actor.role, "control.update_any"):
            raise DomainRuleViolation("Only managers can reassign a control.", 403)
        _validate_owner(db, actor, changes["owner_membership_id"])
    if "document_id" in changes:
        _validate_document(db, actor, changes["document_id"])
    if changes.get("status") == ControlStatus.VERIFICADO and not evidence_count(
        db, actor.organization_id, control.id
    ):
        raise DomainRuleViolation(
            "Attach at least one evidence to this control before marking it verified.", 409
        )
    diff: dict[str, Any] = {}
    for field, value in changes.items():
        before = getattr(control, field)
        if before != value:
            diff[field] = {"from": _plain(before), "to": _plain(value)}
            setattr(control, field, value)
    if diff:
        _audit(db, actor, "control.updated", "control", control.id, diff)
    _reload_owner(db, control, diff)
    if "document_id" in diff:
        db.flush()
        db.expire(control, ["document"])
    return control


def delete(db: Session, actor: Membership, control_id: uuid.UUID) -> Control:
    if not has_permission(actor.role, "control.delete"):
        raise DomainRuleViolation("You do not have permission to delete controls.", 403)
    control = get(db, actor, control_id)
    # Proof that hangs only off this control would be orphaned: refuse, like a cited document.
    orphaned = db.scalar(
        select(func.count())
        .select_from(Evidence)
        .where(
            Evidence.organization_id == actor.organization_id,
            Evidence.control_id == control.id,
            Evidence.risk_id.is_(None),
            Evidence.action_id.is_(None),
        )
    )
    if orphaned:
        raise DomainRuleViolation(
            "This control has evidence attached only to it; remove or re-attach it first.", 409
        )
    # Links cascade; actions and other evidence keep their rows with control_id cleared.
    _audit(db, actor, "control.deleted", "control", control.id, {"title": control.title})
    db.delete(control)
    db.flush()
    return control


# --- graph edges ------------------------------------------------------------------------------


def link_risk(db: Session, actor: Membership, control_id: uuid.UUID, risk_id: uuid.UUID) -> bool:
    """Idempotent. Returns False when the pair already existed."""
    if not has_permission(actor.role, "control.link"):
        raise DomainRuleViolation("You do not have permission to link controls.", 403)
    control = get(db, actor, control_id)
    risk = get_risk(db, actor, risk_id)
    existing = db.scalar(
        select(RiskControl.id).where(
            RiskControl.organization_id == actor.organization_id,
            RiskControl.risk_id == risk.id,
            RiskControl.control_id == control.id,
        )
    )
    if existing is not None:
        return False
    db.add(
        RiskControl(organization_id=actor.organization_id, risk_id=risk.id, control_id=control.id)
    )
    db.flush()
    _audit(
        db,
        actor,
        "control.linked",
        "control",
        control.id,
        {"risk_id": str(risk.id), "risk_title": risk.title},
    )
    return True


def unlink_risk(db: Session, actor: Membership, control_id: uuid.UUID, risk_id: uuid.UUID) -> None:
    if not has_permission(actor.role, "control.link"):
        raise DomainRuleViolation("You do not have permission to link controls.", 403)
    control = get(db, actor, control_id)
    link = db.scalar(
        select(RiskControl).where(
            RiskControl.organization_id == actor.organization_id,
            RiskControl.risk_id == risk_id,
            RiskControl.control_id == control.id,
        )
    )
    if link is None:
        raise DomainRuleViolation("Not Found", 404)
    db.delete(link)
    db.flush()
    _audit(db, actor, "control.unlinked", "control", control.id, {"risk_id": str(risk_id)})


def risks_of(db: Session, organization_id: uuid.UUID, control_id: uuid.UUID) -> list[Risk]:
    return list(
        db.scalars(
            select(Risk)
            .join(RiskControl, (RiskControl.risk_id == Risk.id))
            .where(
                RiskControl.organization_id == organization_id,
                RiskControl.control_id == control_id,
                Risk.organization_id == organization_id,
            )
            .order_by(Risk.severity, Risk.title)
        )
    )


def controls_of_risk(db: Session, organization_id: uuid.UUID, risk_id: uuid.UUID) -> list[Control]:
    return list(
        db.scalars(
            select(Control)
            .join(RiskControl, (RiskControl.control_id == Control.id))
            .where(
                RiskControl.organization_id == organization_id,
                RiskControl.risk_id == risk_id,
                Control.organization_id == organization_id,
            )
            .order_by(Control.title)
        )
    )


def actions_of(db: Session, organization_id: uuid.UUID, control_id: uuid.UUID) -> list[Action]:
    return list(
        db.scalars(
            select(Action)
            .where(Action.organization_id == organization_id, Action.control_id == control_id)
            .order_by(Action.due_date.nulls_last(), Action.created_at)
        )
    )


def coverage_by_risk(db: Session, organization_id: uuid.UUID) -> dict[uuid.UUID, float]:
    """Best coverage credit per risk from its linked controls (Score v2 factor K, D31)."""
    from app.models.control import CONTROL_COVERAGE  # noqa: PLC0415 — local to keep imports light

    rows = db.execute(
        select(RiskControl.risk_id, Control.status)
        .join(Control, Control.id == RiskControl.control_id)
        .where(
            RiskControl.organization_id == organization_id,
            Control.organization_id == organization_id,
        )
    )
    best: dict[uuid.UUID, float] = {}
    for risk_id, status in rows:
        credit = CONTROL_COVERAGE[status]
        if credit > best.get(risk_id, 0.0):
            best[risk_id] = credit
    return best


def summary(db: Session, organization_id: uuid.UUID) -> dict[str, int]:
    rows = db.execute(
        select(Control.status, func.count())
        .where(Control.organization_id == organization_id)
        .group_by(Control.status)
    ).all()
    counts = {s.value: 0 for s in ControlStatus}
    for status, count in rows:
        counts[status.value] = count
    return {"total": sum(counts.values()), **counts}
