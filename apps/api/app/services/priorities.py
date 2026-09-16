"""Smart prioritization (decision D30): which action reduces the most risk for the least effort?

`points = severity weight × exposure (profile) × urgency ÷ effort`, every factor explained in
pt-BR, plus the score the organization would gain by completing the action with proof (pure
simulation with the score engine). Deterministic; no persistence.
"""

import uuid
from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.control import RiskControl
from app.models.domain import Action, ActionEffort, ActionStatus, Risk
from app.models.profile import OrganizationProfile
from app.services import score as score_svc
from app.services.profile import exposure_multiplier
from app.services.score import CLOSED, HIGH, SEVERITY_WEIGHT, today_local

EFFORT_FACTOR: dict[ActionEffort, float] = {
    ActionEffort.BAIXO: 1.0,
    ActionEffort.MEDIO: 1.5,
    ActionEffort.ALTO: 2.5,
}
EFFORT_LABEL = {
    ActionEffort.BAIXO: "esforço baixo",
    ActionEffort.MEDIO: "esforço médio",
    ActionEffort.ALTO: "esforço alto",
}
SEVERITY_LABEL = {"critico": "crítico", "alto": "alto", "medio": "médio", "baixo": "baixo"}
DUE_SOON_DAYS = 7


def _profile(db: Session, organization_id: uuid.UUID) -> OrganizationProfile | None:
    return db.scalar(
        select(OrganizationProfile).where(OrganizationProfile.organization_id == organization_id)
    )


def _urgency(due: date | None, today: date) -> tuple[float, str | None]:
    if due is None:
        return 1.0, None
    if due < today:
        days = (today - due).days
        return 1.5, f"atrasada há {days} {'dia' if days == 1 else 'dias'}"
    left = (due - today).days
    if left <= DUE_SOON_DAYS:
        return (
            1.25,
            "vence hoje" if left == 0 else f"vence em {left} {'dia' if left == 1 else 'dias'}",
        )
    return 1.0, None


def compute(db: Session, organization_id: uuid.UUID, *, limit: int = 10) -> dict[str, Any]:
    today = today_local()
    profile = _profile(db, organization_id)
    inputs = score_svc.gather(db, organization_id)
    current = None
    if inputs is not None:
        payload = score_svc.compute(inputs)
        current = payload["score"] if payload["available"] else None

    rows = db.execute(
        select(Action, Risk)
        .outerjoin(
            Risk, (Risk.id == Action.risk_id) & (Risk.organization_id == Action.organization_id)
        )
        .where(Action.organization_id == organization_id, Action.status != ActionStatus.CONCLUIDA)
    ).all()
    items: list[dict[str, Any]] = []
    for action, risk in rows:
        reasons: list[str] = []
        base = 1.0
        if risk is not None:
            base = float(SEVERITY_WEIGHT[risk.severity])
            if risk.status in CLOSED:
                base = 1.0  # the risk is closed; the action is housekeeping
                reasons.append("risco já encerrado")
            else:
                reasons.append(f"reduz um risco {SEVERITY_LABEL[risk.severity.value]}")
        else:
            reasons.append("sem risco associado")
        exposure, why = exposure_multiplier(profile, risk.category.value if risk else "")
        if why:
            reasons.append(why)
        urgency, when = _urgency(action.due_date, today)
        if when:
            reasons.append(when)
        effort = action.effort or ActionEffort.MEDIO
        if action.effort is not None:
            reasons.append(EFFORT_LABEL[effort])
        if action.status == ActionStatus.BLOQUEADA:
            reasons.append("bloqueada")
        points = base * exposure * urgency / EFFORT_FACTOR[effort]
        gain = None
        if inputs is not None and current is not None:
            simulated = score_svc.simulate(
                inputs,
                resolve_risk=risk.id if risk is not None and risk.status not in CLOSED else None,
                done_action=action.id,
            )
            gain = simulated - current
        items.append(
            {
                "action_id": action.id,
                "title": action.title,
                "status": action.status,
                "due_date": action.due_date,
                "owner": action.owner,
                "risk_id": risk.id if risk else None,
                "risk_title": risk.title if risk else None,
                "risk_severity": risk.severity if risk else None,
                "control_id": action.control_id,
                "effort": action.effort,
                "points": round(points, 2),
                "score_gain": gain,
                "reasons": reasons,
            }
        )
    items.sort(key=lambda it: (-it["points"], it["due_date"] or date.max, it["title"]))

    # Open crítico/alto risks with no open action at all: "planejar" before "executar".
    planned_ids = {a.risk_id for a, _ in rows if a.risk_id is not None}
    linked = set(
        db.scalars(
            select(RiskControl.risk_id).where(RiskControl.organization_id == organization_id)
        )
    )
    unplanned = [
        {
            "risk_id": r.id,
            "title": r.title,
            "severity": r.severity,
            "owner": r.owner,
            "has_control": r.id in linked,
            "score_gain": (
                score_svc.simulate(inputs, resolve_risk=r.id) - current
                if inputs is not None and current is not None
                else None
            ),
        }
        for r in db.scalars(
            select(Risk)
            .where(
                Risk.organization_id == organization_id,
                Risk.status.notin_(list(CLOSED)),
                Risk.severity.in_(list(HIGH)),
            )
            .order_by(Risk.severity, Risk.title)
        )
        if r.id not in planned_ids
    ]
    return {
        "computed_at": score_svc.utcnow(),
        "current_score": current,
        "profile_complete": bool(profile and profile.complete),
        "items": items[:limit],
        "total_pending": len(items),
        "unplanned": unplanned[:limit],
        "due_soon_days": DUE_SOON_DAYS,
    }
