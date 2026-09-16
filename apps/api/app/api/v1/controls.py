"""Controls and the Control Graph edges (decision D27)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select

from app.api.deps import CurrentMembership, DbSession
from app.models.control import Control, ControlStatus
from app.models.domain import Evidence, RiskCategory
from app.schemas.control import (
    ControlCreate,
    ControlGraphOut,
    ControlLinkOut,
    ControlOut,
    ControlUpdate,
    PlanOut,
    PlanRequest,
    RecommendationOut,
    RiskRefOut,
)
from app.schemas.domain import ActionOut
from app.schemas.identity import MessageOut, Page
from app.services import controls as svc
from app.services import recommend, score
from app.services.domain import DomainRuleViolation
from app.services.evidence_status import evidence_out

router = APIRouter(tags=["controls"])


def _raise(exc: DomainRuleViolation) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.message)


def control_out(control: Control) -> ControlOut:
    return ControlOut.model_validate(control)


@router.get("/orgs/{org_id}/controls", response_model=Page[ControlOut])
def list_controls(
    db: DbSession,
    membership: CurrentMembership,
    status: Annotated[list[ControlStatus] | None, Query()] = None,
    category: Annotated[list[RiskCategory] | None, Query()] = None,
    owner_membership_id: uuid.UUID | None = None,
    risk_id: uuid.UUID | None = None,
    limit: int = Query(25, ge=1, le=50),
    offset: int = Query(0, ge=0),
) -> Page[ControlOut]:
    base = select(Control).where(Control.organization_id == membership.organization_id)
    if status:
        base = base.where(Control.status.in_(status))
    if category:
        base = base.where(Control.category.in_(category))
    if owner_membership_id:
        base = base.where(Control.owner_membership_id == owner_membership_id)
    if risk_id:
        from app.models.control import RiskControl  # noqa: PLC0415

        base = base.join(RiskControl, RiskControl.control_id == Control.id).where(
            RiskControl.organization_id == membership.organization_id,
            RiskControl.risk_id == risk_id,
        )
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    # Least mature first: what still needs work is what the list is for.
    rows = db.scalars(base.order_by(Control.status, Control.title).limit(limit).offset(offset))
    return Page[ControlOut](
        items=[control_out(c) for c in rows], total=total, limit=limit, offset=offset
    )


@router.post("/orgs/{org_id}/controls", response_model=ControlOut, status_code=201)
def create_control(
    payload: ControlCreate, db: DbSession, membership: CurrentMembership
) -> ControlOut:
    data = payload.model_dump()
    risk_id = data.pop("risk_id")
    try:
        control = svc.create(db, membership, **data)
        if risk_id is not None:
            svc.link_risk(db, membership, control.id, risk_id)
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    score.recalculate(db, membership.organization_id, "control.created")
    db.commit()
    return control_out(control)


@router.get("/orgs/{org_id}/controls/{control_id}", response_model=ControlGraphOut)
def get_control(
    control_id: uuid.UUID, db: DbSession, membership: CurrentMembership
) -> ControlGraphOut:
    try:
        control = svc.get(db, membership, control_id)
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    org_id = membership.organization_id
    evidence = list(
        db.scalars(
            select(Evidence)
            .where(Evidence.organization_id == org_id, Evidence.control_id == control.id)
            .order_by(Evidence.created_at.desc())
        )
    )
    return ControlGraphOut(
        control=control_out(control),
        risks=[RiskRefOut.model_validate(r) for r in svc.risks_of(db, org_id, control.id)],
        actions=[ActionOut.model_validate(a) for a in svc.actions_of(db, org_id, control.id)],
        evidence=[evidence_out(e) for e in evidence],
        evidence_count=len(evidence),
    )


@router.patch("/orgs/{org_id}/controls/{control_id}", response_model=ControlOut)
def update_control(
    control_id: uuid.UUID, payload: ControlUpdate, db: DbSession, membership: CurrentMembership
) -> ControlOut:
    try:
        control = svc.update(db, membership, control_id, payload.model_dump(exclude_unset=True))
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    score.recalculate(db, membership.organization_id, "control.updated")
    db.commit()
    return control_out(control)


@router.delete("/orgs/{org_id}/controls/{control_id}", response_model=MessageOut)
def delete_control(
    control_id: uuid.UUID, db: DbSession, membership: CurrentMembership
) -> MessageOut:
    try:
        svc.delete(db, membership, control_id)
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    score.recalculate(db, membership.organization_id, "control.deleted")
    db.commit()
    return MessageOut(message="Control deleted.")


@router.post("/orgs/{org_id}/controls/{control_id}/risks/{risk_id}", response_model=ControlLinkOut)
def link_control_risk(
    control_id: uuid.UUID, risk_id: uuid.UUID, db: DbSession, membership: CurrentMembership
) -> ControlLinkOut:
    try:
        created = svc.link_risk(db, membership, control_id, risk_id)
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    if created:
        score.recalculate(db, membership.organization_id, "control.linked")
    db.commit()
    return ControlLinkOut(linked=True, control_id=control_id, risk_id=risk_id)


@router.delete(
    "/orgs/{org_id}/controls/{control_id}/risks/{risk_id}", response_model=ControlLinkOut
)
def unlink_control_risk(
    control_id: uuid.UUID, risk_id: uuid.UUID, db: DbSession, membership: CurrentMembership
) -> ControlLinkOut:
    try:
        svc.unlink_risk(db, membership, control_id, risk_id)
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    score.recalculate(db, membership.organization_id, "control.unlinked")
    db.commit()
    return ControlLinkOut(linked=False, control_id=control_id, risk_id=risk_id)


@router.get("/orgs/{org_id}/risks/{risk_id}/controls", response_model=list[ControlOut])
def list_risk_controls(
    risk_id: uuid.UUID, db: DbSession, membership: CurrentMembership
) -> list[ControlOut]:
    from app.services.domain import get_risk  # noqa: PLC0415

    try:
        get_risk(db, membership, risk_id)
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    return [control_out(c) for c in svc.controls_of_risk(db, membership.organization_id, risk_id)]


# --- Risk-to-Action engine (D29) --------------------------------------------------------------


@router.get("/orgs/{org_id}/risks/{risk_id}/recommendation", response_model=RecommendationOut)
def risk_recommendation(
    risk_id: uuid.UUID, db: DbSession, membership: CurrentMembership
) -> RecommendationOut:
    try:
        rec = recommend.recommendation(db, membership, risk_id)
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    rec["linked_controls"] = [control_out(c) for c in rec["linked_controls"]]
    if rec["existing_action"] is not None:
        rec["existing_action"] = ActionOut.model_validate(rec["existing_action"])
    return RecommendationOut.model_validate(rec)


@router.post("/orgs/{org_id}/risks/{risk_id}/plan", response_model=PlanOut, status_code=201)
def plan_risk(
    risk_id: uuid.UUID, payload: PlanRequest, db: DbSession, membership: CurrentMembership
) -> PlanOut:
    try:
        risk, control, action = recommend.plan(
            db,
            membership,
            risk_id,
            owner_membership_id=payload.owner_membership_id,
            due_date=payload.due_date,
            title=payload.title,
        )
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    score.recalculate(db, membership.organization_id, "risk.planned")
    db.commit()
    return PlanOut(
        risk_id=risk.id,
        control=control_out(control) if control else None,
        action=ActionOut.model_validate(action),
    )
