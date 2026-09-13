import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select

from app.api.deps import CurrentMembership, CurrentUser, DbSession, require
from app.core.permissions import has_permission
from app.models.membership import Membership
from app.schemas.identity import (
    AuditLogOut,
    InvitationOut,
    InviteRequest,
    MemberOut,
    MembershipOut,
    MemberUserOut,
    MeOut,
    MessageOut,
    OrganizationOut,
    OrganizationUpdate,
    Page,
    RoleUpdate,
    UserOut,
)
from app.services import audit
from app.services import membership as members

router = APIRouter(tags=["organizations"])


@router.get("/me", response_model=MeOut, summary="Current user and their organizations")
def me(user: CurrentUser, db: DbSession) -> MeOut:
    rows = db.scalars(
        select(Membership).where(Membership.user_id == user.id).order_by(Membership.created_at)
    )
    return MeOut(
        user=UserOut.model_validate(user),
        memberships=[
            MembershipOut(
                id=m.id, role=m.role, organization=OrganizationOut.model_validate(m.organization)
            )
            for m in rows
        ],
    )


@router.get("/orgs/{org_id}", response_model=OrganizationOut)
def get_org(membership: CurrentMembership) -> OrganizationOut:
    return OrganizationOut.model_validate(membership.organization)


@router.patch("/orgs/{org_id}", response_model=OrganizationOut)
def update_org(
    payload: OrganizationUpdate,
    db: DbSession,
    membership: Annotated[Membership, Depends(require("org.update"))],
) -> OrganizationOut:
    org = membership.organization
    previous = org.name
    org.name = payload.name
    audit.record(
        db,
        action="organization.updated",
        organization_id=org.id,
        actor_user_id=membership.user_id,
        actor_membership_id=membership.id,
        entity_type="organization",
        entity_id=org.id,
        data={"name": {"from": previous, "to": org.name}},
    )
    db.commit()
    return OrganizationOut.model_validate(org)


@router.get("/orgs/{org_id}/members", response_model=list[MemberOut])
def list_members(
    db: DbSession, membership: Annotated[Membership, Depends(require("members.read"))]
) -> list[MemberOut]:
    show_email = has_permission(membership.role, "members.read_emails")
    return [
        MemberOut(
            id=m.id,
            role=m.role,
            created_at=m.created_at,
            user=MemberUserOut(
                id=m.user.id, name=m.user.name, email=m.user.email if show_email else None
            ),
        )
        for m in members.list_members(db, membership.organization_id)
    ]


@router.post("/orgs/{org_id}/members/invitations", response_model=InvitationOut, status_code=201)
def invite_member(
    payload: InviteRequest,
    db: DbSession,
    membership: Annotated[Membership, Depends(require("members.invite"))],
) -> InvitationOut:
    try:
        inv = members.invite(db, actor=membership, email=payload.email, role=payload.role)
    except members.MembershipRuleViolation as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from None
    db.commit()
    return InvitationOut.model_validate(inv)


@router.get("/orgs/{org_id}/members/invitations", response_model=list[InvitationOut])
def list_invitations(
    db: DbSession, membership: Annotated[Membership, Depends(require("members.invite"))]
) -> list[InvitationOut]:
    return [
        InvitationOut.model_validate(i)
        for i in members.list_pending_invitations(db, membership.organization_id)
    ]


@router.delete("/orgs/{org_id}/members/invitations/{invitation_id}", response_model=MessageOut)
def revoke_invitation(
    invitation_id: uuid.UUID,
    db: DbSession,
    membership: Annotated[Membership, Depends(require("members.invite"))],
) -> MessageOut:
    try:
        members.revoke_invitation(db, actor=membership, invitation_id=invitation_id)
    except members.MembershipRuleViolation as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from None
    db.commit()
    return MessageOut(message="Invitation revoked.")


@router.patch("/orgs/{org_id}/members/{membership_id}", response_model=MemberOut)
def change_member_role(
    membership_id: uuid.UUID,
    payload: RoleUpdate,
    db: DbSession,
    membership: Annotated[Membership, Depends(require("members.change_role"))],
) -> MemberOut:
    try:
        target = members.change_role(
            db, actor=membership, membership_id=membership_id, role=payload.role
        )
    except members.MembershipRuleViolation as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from None
    db.commit()
    return MemberOut(
        id=target.id,
        role=target.role,
        created_at=target.created_at,
        user=MemberUserOut(id=target.user.id, name=target.user.name, email=target.user.email),
    )


@router.delete("/orgs/{org_id}/members/{membership_id}", response_model=MessageOut)
def remove_member(
    membership_id: uuid.UUID,
    db: DbSession,
    membership: Annotated[Membership, Depends(require("members.remove"))],
) -> MessageOut:
    try:
        members.remove_member(db, actor=membership, membership_id=membership_id)
    except members.MembershipRuleViolation as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from None
    db.commit()
    return MessageOut(message="Member removed.")


@router.get("/orgs/{org_id}/audit-log", response_model=Page[AuditLogOut])
def audit_log(
    db: DbSession,
    membership: Annotated[Membership, Depends(require("audit.read"))],
    limit: int = Query(25, ge=1, le=50),
    offset: int = Query(0, ge=0),
) -> Page[AuditLogOut]:
    items, total = audit.list_entries(db, membership.organization_id, limit=limit, offset=offset)
    return Page[AuditLogOut](
        items=[AuditLogOut.model_validate(i) for i in items],
        total=total,
        limit=limit,
        offset=offset,
    )
