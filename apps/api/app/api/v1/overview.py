"""Visão geral (CLAUDE.md §4 Dashboard): one round trip for "what needs attention now".

The score itself comes from `/score` (live) and its trend from `/score/history`; this endpoint
aggregates the operational state — counts, the riskiest open items, the actions to execute,
the assessment state and (for managers) the latest audit entries.
"""

from datetime import datetime
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import func, nulls_last, select

from app.api.deps import CurrentMembership, DbSession
from app.core.permissions import has_permission
from app.models.assessment import AssessmentStatus
from app.models.domain import Action, ActionStatus, Risk, RiskSeverity, RiskStatus
from app.schemas.domain import ActionOut, RiskOut
from app.schemas.identity import AuditLogOut
from app.services import assessment as assessment_svc
from app.services import audit
from app.services import documents as documents_svc
from app.services.score import today_local

router = APIRouter(tags=["overview"])

OPEN_RISK = [s for s in RiskStatus if s not in (RiskStatus.RESOLVIDO, RiskStatus.ACEITO)]
ITEMS = 5
ACTIVITY = 8


class RisksOverview(BaseModel):
    open: int
    by_severity: dict[str, int]  # open risks per severity
    in_review: int
    without_owner: int
    items: list[RiskOut]  # open Crítico/Alto first: severity, then earliest due date


class ActionsOverview(BaseModel):
    pending: int  # not concluída
    overdue: int
    blocked: int
    done: int
    items: list[ActionOut]  # overdue first, then earliest due date


class AssessmentOverview(BaseModel):
    status: str  # none | in_progress | completed
    mode: str | None = None
    answered: int = 0
    total: int = 0
    completed_at: datetime | None = None


class DocumentsOverview(BaseModel):
    total: int
    atualizado: int
    vencendo: int
    vencido: int
    faltante: int
    em_revisao: int


class OverviewOut(BaseModel):
    risks: RisksOverview
    actions: ActionsOverview
    assessment: AssessmentOverview
    documents: DocumentsOverview
    recent_activity: list[AuditLogOut] | None = None  # only for roles with audit.read


@router.get("/orgs/{org_id}/overview", response_model=OverviewOut)
def overview(db: DbSession, membership: CurrentMembership) -> OverviewOut:
    org_id = membership.organization_id
    today = today_local()

    sev_rows = db.execute(
        select(Risk.severity, func.count())
        .where(Risk.organization_id == org_id, Risk.status.in_(OPEN_RISK))
        .group_by(Risk.severity)
    ).all()
    by_severity = {s.value: 0 for s in RiskSeverity}
    for severity, count in sev_rows:
        by_severity[severity.value] = count
    in_review = (
        db.scalar(
            select(func.count())
            .select_from(Risk)
            .where(Risk.organization_id == org_id, Risk.status == RiskStatus.EM_REVISAO)
        )
        or 0
    )
    without_owner = (
        db.scalar(
            select(func.count())
            .select_from(Risk)
            .where(
                Risk.organization_id == org_id,
                Risk.status.in_(OPEN_RISK),
                Risk.owner_membership_id.is_(None),
            )
        )
        or 0
    )
    risk_items = db.scalars(
        select(Risk)
        .where(
            Risk.organization_id == org_id,
            Risk.status.in_(OPEN_RISK),
            Risk.severity.in_([RiskSeverity.CRITICO, RiskSeverity.ALTO]),
        )
        .order_by(Risk.severity, nulls_last(Risk.due_date.asc()), Risk.updated_at.desc())
        .limit(ITEMS)
    )

    pending_filter = (Action.organization_id == org_id, Action.status != ActionStatus.CONCLUIDA)
    pending = db.scalar(select(func.count()).select_from(Action).where(*pending_filter)) or 0
    overdue = (
        db.scalar(
            select(func.count()).select_from(Action).where(*pending_filter, Action.due_date < today)
        )
        or 0
    )
    counts_by_status = dict(
        db.execute(
            select(Action.status, func.count())
            .where(Action.organization_id == org_id)
            .group_by(Action.status)
        ).all()
    )
    action_items = db.scalars(
        select(Action)
        .where(*pending_filter)
        .order_by(nulls_last(Action.due_date.asc()), Action.updated_at.desc())
        .limit(ITEMS)
    )

    current = assessment_svc.current(db, org_id)
    if current is None:
        assessment_out = AssessmentOverview(status="none")
    else:
        progress = assessment_svc.progress(db, current)
        assessment_out = AssessmentOverview(
            status="completed" if current.status == AssessmentStatus.COMPLETED else "in_progress",
            mode=current.mode.value,
            answered=progress["answered"],
            total=progress["total"],
            completed_at=current.completed_at,
        )

    activity: list[Any] | None = None
    if has_permission(membership.role, "audit.read"):
        entries, _ = audit.list_entries(db, org_id, limit=ACTIVITY, offset=0)
        activity = [AuditLogOut.model_validate(e) for e in entries]

    return OverviewOut(
        risks=RisksOverview(
            open=sum(by_severity.values()),
            by_severity=by_severity,
            in_review=in_review,
            without_owner=without_owner,
            items=[RiskOut.model_validate(r) for r in risk_items],
        ),
        actions=ActionsOverview(
            pending=pending,
            overdue=overdue,
            blocked=counts_by_status.get(ActionStatus.BLOQUEADA, 0),
            done=counts_by_status.get(ActionStatus.CONCLUIDA, 0),
            items=[ActionOut.model_validate(a) for a in action_items],
        ),
        assessment=assessment_out,
        documents=DocumentsOverview(**documents_svc.summary(db, org_id, today)),
        recent_activity=activity,
    )
