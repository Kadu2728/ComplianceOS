"""Executive summary — CEO mode foundation (decision D33).

Where are we exposed, what matters most, what improved, what worsened, what needs a decision, and
the next 30 days — for someone who will not read 42 answers. Everything is derived from the
records; the caveat travels with the payload.
"""

import uuid
from datetime import timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.control import RiskControl
from app.models.document import DocumentStatus
from app.models.domain import Action, ActionStatus, Risk
from app.models.score import ScoreSnapshot
from app.services import controls, documents, priorities
from app.services import score as score_svc
from app.services.score import CLOSED, HIGH, today_local, utcnow
from app.services.security_copy import CAVEAT

WINDOW_DAYS = 30


def _count(db: Session, org_id: uuid.UUID, action: str, since) -> int:  # noqa: ANN001
    return (
        db.scalar(
            select(func.count())
            .select_from(AuditLog)
            .where(
                AuditLog.organization_id == org_id,
                AuditLog.action == action,
                AuditLog.created_at >= since,
            )
        )
        or 0
    )


def _status_changes_to(db: Session, org_id: uuid.UUID, entity: str, to: str, since) -> int:  # noqa: ANN001
    return (
        db.scalar(
            select(func.count())
            .select_from(AuditLog)
            .where(
                AuditLog.organization_id == org_id,
                AuditLog.entity_type == entity,
                AuditLog.action == f"{entity}.status_changed",
                AuditLog.created_at >= since,
                AuditLog.data["to"].astext == to,
            )
        )
        or 0
    )


def compute(db: Session, org_id: uuid.UUID) -> dict[str, Any]:
    today = today_local()
    now = utcnow()
    since = now - timedelta(days=WINDOW_DAYS)
    score = score_svc.current(db, org_id)
    # Trend against the oldest snapshot inside the window (same version), not only "yesterday".
    oldest = db.scalar(
        select(ScoreSnapshot)
        .where(
            ScoreSnapshot.organization_id == org_id,
            ScoreSnapshot.computed_at >= since,
            ScoreSnapshot.score_version == score_svc.SCORE_VERSION,
        )
        .order_by(ScoreSnapshot.computed_at.asc())
        .limit(1)
    )
    trend = None
    if score.get("available") and oldest is not None:
        trend = {
            "from": oldest.score,
            "to": score["score"],
            "diff": score["score"] - oldest.score,
            "since": oldest.computed_at,
        }

    coverage = controls.coverage_by_risk(db, org_id)
    planned = set(
        db.scalars(
            select(Action.risk_id).where(
                Action.organization_id == org_id,
                Action.risk_id.is_not(None),
                Action.status != ActionStatus.CONCLUIDA,
            )
        )
    )
    exposures = [
        {
            "risk_id": r.id,
            "title": r.title,
            "severity": r.severity,
            "category": r.category,
            "owner": r.owner,
            "planned": r.id in planned,
            "coverage": coverage.get(r.id, 0.0),
            "due_date": r.due_date,
        }
        for r in db.scalars(
            select(Risk)
            .where(
                Risk.organization_id == org_id,
                Risk.status.notin_(list(CLOSED)),
                Risk.severity.in_(list(HIGH)),
            )
            .order_by(Risk.severity, Risk.due_date.nulls_last(), Risk.title)
            .limit(8)
        )
    ]

    improved = {
        "risks_resolved": _status_changes_to(db, org_id, "risk", "resolvido", since),
        "actions_done": _status_changes_to(db, org_id, "action", "concluida", since),
        "controls_implemented": db.scalar(
            select(func.count())
            .select_from(AuditLog)
            .where(
                AuditLog.organization_id == org_id,
                AuditLog.action == "control.updated",
                AuditLog.created_at >= since,
                AuditLog.data["status"]["to"].astext.in_(["implementado", "verificado"]),
            )
        )
        or 0,
        "evidence_added": _count(db, org_id, "evidence.added", since),
    }
    docs = documents.summary(db, org_id, today)
    overdue = (
        db.scalar(
            select(func.count())
            .select_from(Action)
            .where(
                Action.organization_id == org_id,
                Action.status != ActionStatus.CONCLUIDA,
                Action.due_date < today,
            )
        )
        or 0
    )
    worsened = {
        "risks_created": _count(db, org_id, "risk.created", since),
        "actions_overdue": overdue,
        "documents_expired": docs["vencido"],
        "risks_reopened": _status_changes_to(db, org_id, "risk", "aberto", since),
    }

    blocked = list(
        db.scalars(
            select(Action)
            .where(Action.organization_id == org_id, Action.status == ActionStatus.BLOQUEADA)
            .order_by(Action.due_date.nulls_last())
            .limit(5)
        )
    )
    unowned_high = [e for e in exposures if e["owner"] is None]
    expired_docs = list(
        db.scalars(
            documents.list_query(
                org_id,
                status=[DocumentStatus.VENCIDO],
                category=None,
                owner_membership_id=None,
                today=today,
            ).limit(5)
        )
    )
    decisions = (
        [{"kind": "action", "id": a.id, "title": a.title, "why": "bloqueada"} for a in blocked]
        + [
            {"kind": "risk", "id": e["risk_id"], "title": e["title"], "why": "sem responsável"}
            for e in unowned_high
        ]
        + [
            {"kind": "document", "id": d.id, "title": d.name, "why": "vencido"}
            for d in expired_docs
        ]
    )
    prio = priorities.compute(db, org_id, limit=5)
    linked_risks = len(
        set(db.scalars(select(RiskControl.risk_id).where(RiskControl.organization_id == org_id)))
    )
    return {
        "computed_at": now,
        "window_days": WINDOW_DAYS,
        "score": {k: score.get(k) for k in ("available", "score", "band", "preliminary")},
        "trend": trend,
        "exposures": exposures,
        "improved": improved,
        "worsened": worsened,
        "decisions": decisions[:8],
        "next_30_days": prio["items"],
        "unplanned": prio["unplanned"][:5],
        "controls": {**controls.summary(db, org_id), "risks_linked": linked_risks},
        "documents": docs,
        "caveat": CAVEAT,
    }
