"""Organization profile — Compliance DNA v1 (decision D28)."""

from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentMembership, DbSession
from app.schemas.profile import ProfileOut, ProfileUpdate
from app.services import profile as svc
from app.services.domain import DomainRuleViolation

router = APIRouter(tags=["profile"])


@router.get("/orgs/{org_id}/profile", response_model=ProfileOut)
def get_profile(db: DbSession, membership: CurrentMembership) -> ProfileOut:
    profile = svc.get_or_create(db, membership.organization_id)
    db.commit()
    return ProfileOut.model_validate(profile)


@router.put("/orgs/{org_id}/profile", response_model=ProfileOut)
def update_profile(
    payload: ProfileUpdate, db: DbSession, membership: CurrentMembership
) -> ProfileOut:
    try:
        profile = svc.update(db, membership, payload.model_dump(exclude_unset=True))
    except DomainRuleViolation as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from None
    db.commit()
    return ProfileOut.model_validate(profile)
