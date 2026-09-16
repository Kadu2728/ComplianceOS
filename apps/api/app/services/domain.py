"""Risk / Action / Evidence use cases. Every mutation records its audit row in the same transaction.

Severity is derived — never accepted from the client — with the P×I matrix of
docs/product/assessment-v1-scope.md §7. State machines are explicit; invalid transitions are 409.
"""

import uuid
from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import Role, has_permission
from app.core.security import utcnow
from app.models.domain import (
    Action,
    ActionEffort,
    ActionStatus,
    Evidence,
    EvidenceKind,
    Risk,
    RiskCategory,
    RiskSeverity,
    RiskStatus,
)
from app.models.membership import Membership
from app.services import audit


class DomainRuleViolation(Exception):
    def __init__(self, message: str, status_code: int = 409) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


# --- severity ---------------------------------------------------------------------------------


def derive_severity(probability: int, impact: int) -> RiskSeverity:
    score = probability * impact
    if score >= 12:
        return RiskSeverity.CRITICO
    if score >= 8:
        return RiskSeverity.ALTO
    if score >= 4:
        return RiskSeverity.MEDIO
    return RiskSeverity.BAIXO


# --- state machines ---------------------------------------------------------------------------

RISK_TRANSITIONS: dict[RiskStatus, frozenset[RiskStatus]] = {
    RiskStatus.ABERTO: frozenset(
        {RiskStatus.EM_ANDAMENTO, RiskStatus.EM_REVISAO, RiskStatus.ACEITO}
    ),
    RiskStatus.EM_ANDAMENTO: frozenset(
        {RiskStatus.EM_REVISAO, RiskStatus.ABERTO, RiskStatus.ACEITO}
    ),
    RiskStatus.EM_REVISAO: frozenset(
        {RiskStatus.RESOLVIDO, RiskStatus.EM_ANDAMENTO, RiskStatus.ABERTO}
    ),
    RiskStatus.RESOLVIDO: frozenset({RiskStatus.ABERTO}),  # reopen (managers only)
    RiskStatus.ACEITO: frozenset({RiskStatus.ABERTO}),
}

ACTION_TRANSITIONS: dict[ActionStatus, frozenset[ActionStatus]] = {
    ActionStatus.A_FAZER: frozenset({ActionStatus.EM_ANDAMENTO, ActionStatus.BLOQUEADA}),
    ActionStatus.EM_ANDAMENTO: frozenset(
        {
            ActionStatus.EM_REVISAO,
            ActionStatus.CONCLUIDA,
            ActionStatus.BLOQUEADA,
            ActionStatus.A_FAZER,
        }
    ),
    ActionStatus.EM_REVISAO: frozenset({ActionStatus.CONCLUIDA, ActionStatus.EM_ANDAMENTO}),
    ActionStatus.BLOQUEADA: frozenset({ActionStatus.A_FAZER, ActionStatus.EM_ANDAMENTO}),
    ActionStatus.CONCLUIDA: frozenset({ActionStatus.A_FAZER}),  # reopen (managers only)
}

MANAGER_ONLY_TRANSITIONS = {
    (RiskStatus.RESOLVIDO, RiskStatus.ABERTO),
    (RiskStatus.ACEITO, RiskStatus.ABERTO),
    (RiskStatus.ABERTO, RiskStatus.ACEITO),
    (RiskStatus.EM_ANDAMENTO, RiskStatus.ACEITO),
    (ActionStatus.CONCLUIDA, ActionStatus.A_FAZER),
}


# --- authorization helpers --------------------------------------------------------------------


def _can_edit(actor: Membership, owner_membership_id: uuid.UUID | None, kind: str) -> bool:
    if has_permission(actor.role, f"{kind}.update_any"):
        return True
    return has_permission(actor.role, f"{kind}.update_assigned") and owner_membership_id == actor.id


def _require_edit(actor: Membership, owner_membership_id: uuid.UUID | None, kind: str) -> None:
    if not _can_edit(actor, owner_membership_id, kind):
        raise DomainRuleViolation("You can only change items assigned to you.", 403)


def _validate_owner(db: Session, actor: Membership, owner_membership_id: uuid.UUID | None) -> None:
    if owner_membership_id is None:
        return
    exists = db.scalar(
        select(Membership.id).where(
            Membership.id == owner_membership_id,
            Membership.organization_id == actor.organization_id,
        )
    )
    if exists is None:
        raise DomainRuleViolation("Owner must be a member of this organization.", 422)


def _validate_control(db: Session, actor: Membership, control_id: uuid.UUID | None) -> None:
    """A linked control must be one of ours (Control Graph, D27); 422 keeps the FK from firing."""
    if control_id is None:
        return
    from app.models.control import Control  # noqa: PLC0415 — controls import this module

    exists = db.scalar(
        select(Control.id).where(
            Control.id == control_id, Control.organization_id == actor.organization_id
        )
    )
    if exists is None:
        raise DomainRuleViolation("Control must belong to this organization.", 422)


def _audit(
    db: Session,
    actor: Membership,
    action: str,
    entity: str,
    entity_id: uuid.UUID,
    data: dict[str, Any] | None = None,
) -> None:
    audit.record(
        db,
        action=action,
        organization_id=actor.organization_id,
        actor_user_id=actor.user_id,
        actor_membership_id=actor.id,
        entity_type=entity,
        entity_id=entity_id,
        data=data,
    )


# --- risks ------------------------------------------------------------------------------------


def get_risk(db: Session, actor: Membership, risk_id: uuid.UUID) -> Risk:
    risk = db.scalar(
        select(Risk).where(Risk.id == risk_id, Risk.organization_id == actor.organization_id)
    )
    if risk is None:
        raise DomainRuleViolation("Not Found", 404)
    return risk


def create_risk(
    db: Session,
    actor: Membership,
    *,
    title: str,
    description: str | None,
    category: RiskCategory,
    probability: int,
    impact: int,
    owner_membership_id: uuid.UUID | None,
    due_date: date | None,
    treatment: str | None,
) -> Risk:
    if not has_permission(actor.role, "risk.create"):
        raise DomainRuleViolation("You do not have permission to create risks.", 403)
    _validate_owner(db, actor, owner_membership_id)
    risk = Risk(
        organization_id=actor.organization_id,
        title=title,
        description=description,
        category=category,
        probability=probability,
        impact=impact,
        severity=derive_severity(probability, impact),
        owner_membership_id=owner_membership_id,
        due_date=due_date,
        treatment=treatment,
        created_by_membership_id=actor.id,
    )
    db.add(risk)
    db.flush()
    _audit(
        db,
        actor,
        "risk.created",
        "risk",
        risk.id,
        {"title": title, "severity": risk.severity.value},
    )
    return risk


def update_risk(
    db: Session, actor: Membership, risk_id: uuid.UUID, changes: dict[str, Any]
) -> Risk:
    risk = get_risk(db, actor, risk_id)
    _require_edit(actor, risk.owner_membership_id, "risk")
    if "owner_membership_id" in changes:
        if not has_permission(actor.role, "risk.update_any"):
            raise DomainRuleViolation("Only managers can reassign a risk.", 403)
        _validate_owner(db, actor, changes["owner_membership_id"])
    diff: dict[str, Any] = {}
    for field, value in changes.items():
        before = getattr(risk, field)
        if before != value:
            diff[field] = {"from": _plain(before), "to": _plain(value)}
            setattr(risk, field, value)
    if "probability" in changes or "impact" in changes:
        new_sev = derive_severity(risk.probability, risk.impact)
        if new_sev != risk.severity:
            diff["severity"] = {"from": risk.severity.value, "to": new_sev.value}
            risk.severity = new_sev
    if diff:
        _audit(db, actor, "risk.updated", "risk", risk.id, diff)
    _reload_owner(db, risk, diff)
    return risk


def change_risk_status(
    db: Session, actor: Membership, risk_id: uuid.UUID, status: RiskStatus
) -> Risk:
    risk = get_risk(db, actor, risk_id)
    _require_edit(actor, risk.owner_membership_id, "risk")
    _transition(actor, risk.status, status, RISK_TRANSITIONS)
    previous = risk.status
    risk.status = status
    risk.resolved_at = utcnow() if status == RiskStatus.RESOLVIDO else None
    _audit(
        db,
        actor,
        "risk.status_changed",
        "risk",
        risk.id,
        {"from": previous.value, "to": status.value},
    )
    return risk


# --- actions ----------------------------------------------------------------------------------


def get_action(db: Session, actor: Membership, action_id: uuid.UUID) -> Action:
    action = db.scalar(
        select(Action).where(
            Action.id == action_id, Action.organization_id == actor.organization_id
        )
    )
    if action is None:
        raise DomainRuleViolation("Not Found", 404)
    return action


def create_action(
    db: Session,
    actor: Membership,
    *,
    title: str,
    description: str | None,
    risk_id: uuid.UUID | None,
    owner_membership_id: uuid.UUID | None,
    due_date: date | None,
    control_id: uuid.UUID | None = None,
    effort: ActionEffort | None = None,
) -> Action:
    if not has_permission(actor.role, "action.create"):
        raise DomainRuleViolation("You do not have permission to create actions.", 403)
    if risk_id is not None:
        get_risk(db, actor, risk_id)  # 404 if it is not ours
    _validate_control(db, actor, control_id)
    _validate_owner(db, actor, owner_membership_id)
    action = Action(
        organization_id=actor.organization_id,
        risk_id=risk_id,
        control_id=control_id,
        title=title,
        description=description,
        effort=effort,
        owner_membership_id=owner_membership_id,
        due_date=due_date,
        created_by_membership_id=actor.id,
    )
    db.add(action)
    db.flush()
    _audit(
        db,
        actor,
        "action.created",
        "action",
        action.id,
        {"title": title, "risk_id": _plain(risk_id)},
    )
    return action


def update_action(
    db: Session, actor: Membership, action_id: uuid.UUID, changes: dict[str, Any]
) -> Action:
    action = get_action(db, actor, action_id)
    _require_edit(actor, action.owner_membership_id, "action")
    if "owner_membership_id" in changes:
        if not has_permission(actor.role, "action.update_any"):
            raise DomainRuleViolation("Only managers can reassign an action.", 403)
        _validate_owner(db, actor, changes["owner_membership_id"])
    if changes.get("risk_id") is not None:
        get_risk(db, actor, changes["risk_id"])
    if changes.get("control_id") is not None:
        _validate_control(db, actor, changes["control_id"])
    diff: dict[str, Any] = {}
    for field, value in changes.items():
        before = getattr(action, field)
        if before != value:
            diff[field] = {"from": _plain(before), "to": _plain(value)}
            setattr(action, field, value)
    if diff:
        _audit(db, actor, "action.updated", "action", action.id, diff)
    _reload_owner(db, action, diff)
    return action


def change_action_status(
    db: Session, actor: Membership, action_id: uuid.UUID, status: ActionStatus
) -> Action:
    action = get_action(db, actor, action_id)
    _require_edit(actor, action.owner_membership_id, "action")
    _transition(actor, action.status, status, ACTION_TRANSITIONS)
    previous = action.status
    action.status = status
    action.completed_at = utcnow() if status == ActionStatus.CONCLUIDA else None
    _audit(
        db,
        actor,
        "action.status_changed",
        "action",
        action.id,
        {"from": previous.value, "to": status.value},
    )
    return action


# --- evidence ---------------------------------------------------------------------------------


def add_evidence(
    db: Session,
    actor: Membership,
    *,
    kind: EvidenceKind,
    risk_id: uuid.UUID | None,
    action_id: uuid.UUID | None,
    note: str | None = None,
    url: str | None = None,
    filename: str | None = None,
    content_type: str | None = None,
    document_id: uuid.UUID | None = None,
    control_id: uuid.UUID | None = None,
    valid_until: date | None = None,
) -> Evidence:
    if not has_permission(actor.role, "evidence.upload"):
        raise DomainRuleViolation("You do not have permission to add evidence.", 403)
    if risk_id is None and action_id is None and control_id is None:
        raise DomainRuleViolation("Attach the evidence to a risk, an action or a control.", 422)
    _validate_control(db, actor, control_id)
    if (kind == EvidenceKind.DOCUMENT) != (document_id is not None):
        raise DomainRuleViolation("A document citation requires document_id (and only then).", 422)
    if risk_id is not None:
        get_risk(db, actor, risk_id)
    if action_id is not None:
        get_action(db, actor, action_id)
    if document_id is not None:
        from app.services import documents  # noqa: PLC0415 — avoids an import cycle

        documents.get(db, actor, document_id)
    evidence = Evidence(
        organization_id=actor.organization_id,
        risk_id=risk_id,
        action_id=action_id,
        control_id=control_id,
        document_id=document_id,
        kind=kind,
        note=note,
        url=url,
        filename=filename,
        content_type=content_type,
        valid_until=valid_until,
        added_by_membership_id=actor.id,
    )
    db.add(evidence)
    db.flush()
    _audit(
        db,
        actor,
        "evidence.added",
        "evidence",
        evidence.id,
        {
            "kind": kind.value,
            "risk_id": _plain(risk_id),
            "action_id": _plain(action_id),
            "control_id": _plain(control_id),
            "document_id": _plain(document_id),
        },
    )
    return evidence


def get_evidence(db: Session, actor: Membership, evidence_id: uuid.UUID) -> Evidence:
    row = db.scalar(
        select(Evidence).where(
            Evidence.id == evidence_id, Evidence.organization_id == actor.organization_id
        )
    )
    if row is None:
        raise DomainRuleViolation("Not Found", 404)
    return row


def delete_evidence(db: Session, actor: Membership, evidence_id: uuid.UUID) -> Evidence:
    row = get_evidence(db, actor, evidence_id)
    if not has_permission(actor.role, "evidence.delete"):
        raise DomainRuleViolation("You do not have permission to delete evidence.", 403)
    _audit(db, actor, "evidence.deleted", "evidence", row.id, {"kind": row.kind.value})
    db.delete(row)
    return row


# --- internals --------------------------------------------------------------------------------


def _reload_owner(db: Session, row: Any, diff: dict[str, Any]) -> None:
    """The view-only `owner` relationship does not follow `owner_membership_id` on its own
    (sessions do not expire on commit); reload it so the response shows the new person."""
    if "owner_membership_id" in diff:
        db.flush()
        db.expire(row, ["owner"])


def _transition(
    actor: Membership, current: Any, target: Any, table: dict[Any, frozenset[Any]]
) -> None:
    if target == current:
        raise DomainRuleViolation("Already in that status.")
    if target not in table[current]:
        raise DomainRuleViolation(f"Cannot move from {current.value} to {target.value}.")
    if (current, target) in MANAGER_ONLY_TRANSITIONS and actor.role not in (Role.OWNER, Role.ADMIN):
        raise DomainRuleViolation("Only managers can perform this transition.", 403)


def _plain(value: Any) -> Any:
    if value is None or isinstance(value, str | int | float | bool):
        return value
    if hasattr(value, "value"):
        return value.value
    return str(value)
