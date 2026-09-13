import uuid
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select

from app.api.deps import CurrentMembership, DbSession
from app.models.domain import Action, ActionStatus, Risk, RiskSeverity, RiskStatus
from app.schemas.domain import (
    ActionCreate,
    ActionOut,
    ActionStatusChange,
    ActionUpdate,
    RiskCreate,
    RiskOut,
    RiskStatusChange,
    RiskUpdate,
)
from app.schemas.identity import Page
from app.services import domain, score
from app.services.score import today_local

router = APIRouter(tags=["risks", "actions"])


def risk_out(risk: Risk) -> RiskOut:
    return RiskOut.model_validate(risk)


def action_out(action: Action) -> ActionOut:
    return ActionOut.model_validate(action)


def _raise(exc: domain.DomainRuleViolation) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.message)


# --- risks ---


@router.get("/orgs/{org_id}/risks", response_model=Page[RiskOut])
def list_risks(
    db: DbSession,
    membership: CurrentMembership,
    status: Annotated[list[RiskStatus] | None, Query()] = None,
    severity: Annotated[list[RiskSeverity] | None, Query()] = None,
    owner_membership_id: uuid.UUID | None = None,
    limit: int = Query(25, ge=1, le=50),
    offset: int = Query(0, ge=0),
) -> Page[RiskOut]:
    base = select(Risk).where(Risk.organization_id == membership.organization_id)
    if status:
        base = base.where(Risk.status.in_(status))
    if severity:
        base = base.where(Risk.severity.in_(severity))
    if owner_membership_id:
        base = base.where(Risk.owner_membership_id == owner_membership_id)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    # Critical first, then most recently updated. Enum order is the declaration order.
    rows = db.scalars(
        base.order_by(Risk.severity, Risk.updated_at.desc()).limit(limit).offset(offset)
    )
    return Page[RiskOut](items=[risk_out(r) for r in rows], total=total, limit=limit, offset=offset)


@router.post("/orgs/{org_id}/risks", response_model=RiskOut, status_code=201)
def create_risk(payload: RiskCreate, db: DbSession, membership: CurrentMembership) -> RiskOut:
    try:
        risk = domain.create_risk(db, membership, **payload.model_dump())
    except domain.DomainRuleViolation as exc:
        raise _raise(exc) from None
    score.recalculate(db, membership.organization_id, "risk.created")
    db.commit()
    return risk_out(risk)


@router.get("/orgs/{org_id}/risks/{risk_id}", response_model=RiskOut)
def get_risk(risk_id: uuid.UUID, db: DbSession, membership: CurrentMembership) -> RiskOut:
    try:
        return risk_out(domain.get_risk(db, membership, risk_id))
    except domain.DomainRuleViolation as exc:
        raise _raise(exc) from None


@router.patch("/orgs/{org_id}/risks/{risk_id}", response_model=RiskOut)
def update_risk(
    risk_id: uuid.UUID, payload: RiskUpdate, db: DbSession, membership: CurrentMembership
) -> RiskOut:
    try:
        risk = domain.update_risk(db, membership, risk_id, payload.model_dump(exclude_unset=True))
    except domain.DomainRuleViolation as exc:
        raise _raise(exc) from None
    score.recalculate(db, membership.organization_id, "risk.updated")
    db.commit()
    return risk_out(risk)


@router.post("/orgs/{org_id}/risks/{risk_id}/status", response_model=RiskOut)
def change_risk_status(
    risk_id: uuid.UUID, payload: RiskStatusChange, db: DbSession, membership: CurrentMembership
) -> RiskOut:
    try:
        risk = domain.change_risk_status(db, membership, risk_id, payload.status)
    except domain.DomainRuleViolation as exc:
        raise _raise(exc) from None
    score.recalculate(db, membership.organization_id, "risk.status_changed")
    db.commit()
    return risk_out(risk)


@router.get("/orgs/{org_id}/risks/{risk_id}/actions", response_model=list[ActionOut])
def list_risk_actions(
    risk_id: uuid.UUID, db: DbSession, membership: CurrentMembership
) -> list[ActionOut]:
    try:
        domain.get_risk(db, membership, risk_id)
    except domain.DomainRuleViolation as exc:
        raise _raise(exc) from None
    rows = db.scalars(
        select(Action)
        .where(Action.organization_id == membership.organization_id, Action.risk_id == risk_id)
        .order_by(Action.due_date.nulls_last(), Action.created_at)
    )
    return [action_out(a) for a in rows]


# --- actions ---


@router.get("/orgs/{org_id}/actions", response_model=Page[ActionOut])
def list_actions(
    db: DbSession,
    membership: CurrentMembership,
    status: Annotated[list[ActionStatus] | None, Query()] = None,
    owner_membership_id: uuid.UUID | None = None,
    overdue: bool | None = None,
    limit: int = Query(25, ge=1, le=50),
    offset: int = Query(0, ge=0),
) -> Page[ActionOut]:
    base = select(Action).where(Action.organization_id == membership.organization_id)
    if status:
        base = base.where(Action.status.in_(status))
    if owner_membership_id:
        base = base.where(Action.owner_membership_id == owner_membership_id)
    if overdue:
        base = base.where(
            Action.due_date < today_local(),
            Action.status.notin_([ActionStatus.CONCLUIDA]),
        )
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(
        base.order_by(Action.due_date.nulls_last(), Action.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return Page[ActionOut](
        items=[action_out(a) for a in rows], total=total, limit=limit, offset=offset
    )


@router.post("/orgs/{org_id}/actions", response_model=ActionOut, status_code=201)
def create_action(payload: ActionCreate, db: DbSession, membership: CurrentMembership) -> ActionOut:
    try:
        action = domain.create_action(db, membership, **payload.model_dump())
    except domain.DomainRuleViolation as exc:
        raise _raise(exc) from None
    score.recalculate(db, membership.organization_id, "action.created")
    db.commit()
    return action_out(action)


@router.get("/orgs/{org_id}/actions/{action_id}", response_model=ActionOut)
def get_action(action_id: uuid.UUID, db: DbSession, membership: CurrentMembership) -> ActionOut:
    try:
        return action_out(domain.get_action(db, membership, action_id))
    except domain.DomainRuleViolation as exc:
        raise _raise(exc) from None


@router.patch("/orgs/{org_id}/actions/{action_id}", response_model=ActionOut)
def update_action(
    action_id: uuid.UUID, payload: ActionUpdate, db: DbSession, membership: CurrentMembership
) -> ActionOut:
    try:
        action = domain.update_action(
            db, membership, action_id, payload.model_dump(exclude_unset=True)
        )
    except domain.DomainRuleViolation as exc:
        raise _raise(exc) from None
    score.recalculate(db, membership.organization_id, "action.updated")
    db.commit()
    return action_out(action)


@router.post("/orgs/{org_id}/actions/{action_id}/status", response_model=ActionOut)
def change_action_status(
    action_id: uuid.UUID,
    payload: ActionStatusChange,
    db: DbSession,
    membership: CurrentMembership,
) -> ActionOut:
    try:
        action = domain.change_action_status(db, membership, action_id, payload.status)
    except domain.DomainRuleViolation as exc:
        raise _raise(exc) from None
    score.recalculate(db, membership.organization_id, "action.status_changed")
    db.commit()
    return action_out(action)
