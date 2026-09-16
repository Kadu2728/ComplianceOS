"""Risk-to-Action engine v1 (decision D29): from "qual é o meu risco?" to "o que eu faço agora?".

Deterministic. The recommended control comes from the versioned catalogue (by the risk's origin
question, or by category for manual risks); the action comes from the risk's own suggestion or
the catalogue; the default due date is a product default by severity — never a legal deadline.
`plan()` applies the recommendation in one transaction and is idempotent while an open action
exists for the risk.
"""

import json
import uuid
from dataclasses import dataclass
from datetime import date, timedelta
from functools import lru_cache
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import has_permission
from app.models.control import Control, ControlKind, ControlStatus
from app.models.domain import Action, ActionStatus, Risk, RiskCategory, RiskSeverity
from app.models.membership import Membership
from app.services import controls as controls_svc
from app.services.domain import DomainRuleViolation, _audit, create_action, get_risk
from app.services.score import today_local

CATALOGUE_PATH = Path(__file__).resolve().parents[1] / "content" / "controls_v1.json"

# Product defaults (days until the recommended action is due), by severity. Not legal deadlines.
DEFAULT_DUE_DAYS: dict[RiskSeverity, int] = {
    RiskSeverity.CRITICO: 15,
    RiskSeverity.ALTO: 30,
    RiskSeverity.MEDIO: 60,
    RiskSeverity.BAIXO: 90,
}


@dataclass(frozen=True)
class CatalogueControl:
    code: str
    title: str
    category: str
    kind: str
    description: str
    action: str
    evidence: str
    questions: tuple[str, ...]
    category_default: bool


@lru_cache
def catalogue() -> dict[str, CatalogueControl]:
    data = json.loads(CATALOGUE_PATH.read_text(encoding="utf-8"))
    out: dict[str, CatalogueControl] = {}
    for c in data["controls"]:
        out[c["code"]] = CatalogueControl(
            code=c["code"],
            title=c["title"],
            category=c["category"],
            kind=c["kind"],
            description=c["description"],
            action=c["action"],
            evidence=c["evidence"],
            questions=tuple(c["questions"]),
            category_default=bool(c.get("category_default")),
        )
    return out


@lru_cache
def _by_question() -> dict[str, CatalogueControl]:
    return {q: c for c in catalogue().values() for q in c.questions}


@lru_cache
def _by_category() -> dict[str, CatalogueControl]:
    return {c.category: c for c in catalogue().values() if c.category_default}


def catalogue_control_for(risk: Risk) -> CatalogueControl | None:
    if risk.origin_question_code and risk.origin_question_code in _by_question():
        return _by_question()[risk.origin_question_code]
    return _by_category().get(risk.category.value)


def existing_control(db: Session, organization_id: uuid.UUID, code: str) -> Control | None:
    return db.scalar(
        select(Control)
        .where(Control.organization_id == organization_id, Control.template_code == code)
        .order_by(Control.created_at)
        .limit(1)
    )


def open_action(db: Session, organization_id: uuid.UUID, risk_id: uuid.UUID) -> Action | None:
    return db.scalar(
        select(Action)
        .where(
            Action.organization_id == organization_id,
            Action.risk_id == risk_id,
            Action.status != ActionStatus.CONCLUIDA,
        )
        .order_by(Action.created_at)
        .limit(1)
    )


def recommendation(db: Session, actor: Membership, risk_id: uuid.UUID) -> dict[str, Any]:
    """What the engine would do for this risk, and what already exists."""
    risk = get_risk(db, actor, risk_id)
    org_id = actor.organization_id
    template = catalogue_control_for(risk)
    linked = controls_svc.controls_of_risk(db, org_id, risk.id)
    existing = existing_control(db, org_id, template.code) if template else None
    action = open_action(db, org_id, risk.id)
    due = today_local() + timedelta(days=DEFAULT_DUE_DAYS[risk.severity])
    action_title = risk.suggested_action or (template.action if template else None)
    return {
        "risk_id": risk.id,
        "severity": risk.severity,
        "planned": action is not None,
        "existing_action": action,
        "linked_controls": linked,
        "control": {
            "code": template.code,
            "title": template.title,
            "description": template.description,
            "category": template.category,
            "kind": template.kind,
            "exists": existing is not None,
            "existing_id": existing.id if existing else None,
            "already_linked": any(c.template_code == template.code for c in linked),
        }
        if template
        else None,
        "action_title": action_title,
        "default_due_date": due,
        "default_owner_membership_id": risk.owner_membership_id or actor.id,
        "expected_evidence": risk.expected_evidence or (template.evidence if template else None),
        "basis": (
            f"Recomendação do catálogo v1 pela pergunta {risk.origin_question_code}"
            if risk.origin_question_code
            else "Recomendação do catálogo v1 pela categoria do risco"
        ),
    }


def plan(
    db: Session,
    actor: Membership,
    risk_id: uuid.UUID,
    *,
    owner_membership_id: uuid.UUID | None = None,
    due_date: date | None = None,
    title: str | None = None,
) -> tuple[Risk, Control | None, Action]:
    """Apply the recommendation: reuse or create the control, link it, create the action."""
    if not has_permission(actor.role, "action.create"):
        raise DomainRuleViolation("You do not have permission to plan risks.", 403)
    risk = get_risk(db, actor, risk_id)
    org_id = actor.organization_id
    if (existing := open_action(db, org_id, risk.id)) is not None:
        raise DomainRuleViolation(f"This risk already has an open action ({existing.title}).", 409)
    template = catalogue_control_for(risk)
    control: Control | None = None
    if template is not None:
        control = existing_control(db, org_id, template.code)
        if control is None:
            control = controls_svc.create(
                db,
                actor,
                title=template.title,
                category=RiskCategory(template.category),
                description=template.description,
                kind=ControlKind(template.kind),
                status=ControlStatus.PLANEJADO,
                owner_membership_id=risk.owner_membership_id,
                template_code=template.code,
            )
        controls_svc.link_risk(db, actor, control.id, risk.id)
    action_title = title or risk.suggested_action or (template.action if template else None)
    if not action_title:
        raise DomainRuleViolation("No recommended action for this risk; create one manually.", 422)
    expected = risk.expected_evidence or (template.evidence if template else "—")
    action = create_action(
        db,
        actor,
        title=action_title[:200],
        description=(
            f"Ação planejada a partir do risco “{risk.title}”. Evidência esperada: {expected}"
        ),
        risk_id=risk.id,
        control_id=control.id if control else None,
        owner_membership_id=owner_membership_id or risk.owner_membership_id or actor.id,
        due_date=due_date or today_local() + timedelta(days=DEFAULT_DUE_DAYS[risk.severity]),
    )
    _audit(
        db,
        actor,
        "risk.planned",
        "risk",
        risk.id,
        {
            "action_id": str(action.id),
            "control_id": str(control.id) if control else None,
            "template_code": template.code if template else None,
        },
    )
    return risk, control, action
