"""Membership and invitation use cases. Rules (decision D8):
- ADMIN may not grant, revoke or remove the OWNER role.
- Nobody may change their own role or remove themselves through this API.
- The last OWNER of an organization can be neither demoted nor removed.
"""

import uuid
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.email import EmailMessage, get_email_sender
from app.core.permissions import Role
from app.core.security import hash_password, hash_token, new_opaque_token, utcnow
from app.models.auth import Invitation
from app.models.membership import Membership
from app.models.user import User
from app.services import audit
from app.services.auth import find_user_by_email, normalize_email


class MembershipRuleViolation(Exception):
    def __init__(self, message: str, status_code: int = 409) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def list_members(db: Session, organization_id: uuid.UUID) -> list[Membership]:
    return list(
        db.scalars(
            select(Membership)
            .where(Membership.organization_id == organization_id)
            .order_by(Membership.created_at)
        )
    )


def _owner_count(db: Session, organization_id: uuid.UUID) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(Membership)
            .where(Membership.organization_id == organization_id, Membership.role == Role.OWNER)
        )
        or 0
    )


def _get_target(db: Session, actor: Membership, membership_id: uuid.UUID) -> Membership:
    target = db.scalar(
        select(Membership).where(
            Membership.id == membership_id, Membership.organization_id == actor.organization_id
        )
    )
    if target is None:
        raise MembershipRuleViolation("Not Found", 404)
    return target


def invite(db: Session, *, actor: Membership, email: str, role: Role) -> Invitation:
    email = normalize_email(email)
    if role == Role.OWNER and actor.role != Role.OWNER:
        raise MembershipRuleViolation("Only an owner can invite another owner.", 403)
    existing_user = find_user_by_email(db, email)
    if existing_user is not None:
        already = db.scalar(
            select(Membership).where(
                Membership.organization_id == actor.organization_id,
                Membership.user_id == existing_user.id,
            )
        )
        if already is not None:
            raise MembershipRuleViolation("This person is already a member.")
    s = get_settings()
    token = new_opaque_token()
    invitation = Invitation(
        organization_id=actor.organization_id,
        email=email,
        role=role,
        token_hash=hash_token(token),
        invited_by_membership_id=actor.id,
        expires_at=utcnow() + timedelta(days=s.invitation_ttl_days),
    )
    db.add(invitation)
    db.flush()
    audit.record(
        db,
        action="membership.invited",
        organization_id=actor.organization_id,
        actor_user_id=actor.user_id,
        actor_membership_id=actor.id,
        entity_type="invitation",
        entity_id=invitation.id,
        data={"email": email, "role": role.value},
    )
    get_email_sender().send(
        EmailMessage(
            to=email,
            subject=f"Convite para {actor.organization.name} — Compliance OS",
            text=(
                f"Você foi convidado(a) para {actor.organization.name} como {role.value}.\n\n"
                f"Aceite em: {s.app_base_url}/convite?token={token}\n\n"
                f"O convite expira em {s.invitation_ttl_days} dias."
            ),
        )
    )
    return invitation


def list_pending_invitations(db: Session, organization_id: uuid.UUID) -> list[Invitation]:
    """Open invitations only: not accepted and not expired. Newest first."""
    return list(
        db.scalars(
            select(Invitation)
            .where(
                Invitation.organization_id == organization_id,
                Invitation.accepted_at.is_(None),
                Invitation.expires_at > utcnow(),
            )
            .order_by(Invitation.created_at.desc())
        )
    )


def revoke_invitation(db: Session, *, actor: Membership, invitation_id: uuid.UUID) -> None:
    """Expire the invitation now; the token stops working, the row stays for the audit trail."""
    invitation = db.scalar(
        select(Invitation).where(
            Invitation.id == invitation_id,
            Invitation.organization_id == actor.organization_id,
        )
    )
    if (
        invitation is None
        or invitation.accepted_at is not None
        or invitation.expires_at <= utcnow()
    ):
        raise MembershipRuleViolation("Not Found", 404)  # only a pending invitation is revocable
    invitation.expires_at = utcnow()
    audit.record(
        db,
        action="membership.invitation_revoked",
        organization_id=actor.organization_id,
        actor_user_id=actor.user_id,
        actor_membership_id=actor.id,
        entity_type="invitation",
        entity_id=invitation.id,
        data={"email": invitation.email, "role": invitation.role.value},
    )


def accept_invitation(
    db: Session, *, token: str, name: str | None, password: str | None
) -> tuple[User, Membership]:
    inv = db.scalar(select(Invitation).where(Invitation.token_hash == hash_token(token)))
    now = utcnow()
    if inv is None or inv.accepted_at is not None or inv.expires_at <= now:
        raise MembershipRuleViolation("Invitation is invalid or expired.", 400)
    user = find_user_by_email(db, inv.email)
    if user is None:
        if not name or not password:
            raise MembershipRuleViolation(
                "Name and password are required to create your account.", 422
            )
        user = User(email=inv.email, name=name, password_hash=hash_password(password))
        db.add(user)
        db.flush()
        audit.record(
            db, action="user.signup", actor_user_id=user.id, entity_type="user", entity_id=user.id
        )
    existing = db.scalar(
        select(Membership).where(
            Membership.organization_id == inv.organization_id, Membership.user_id == user.id
        )
    )
    if existing is not None:
        raise MembershipRuleViolation("This person is already a member.")
    membership = Membership(organization_id=inv.organization_id, user_id=user.id, role=inv.role)
    db.add(membership)
    inv.accepted_at = now
    db.flush()
    audit.record(
        db,
        action="membership.accepted",
        organization_id=inv.organization_id,
        actor_user_id=user.id,
        actor_membership_id=membership.id,
        entity_type="membership",
        entity_id=membership.id,
        data={"role": inv.role.value},
    )
    return user, membership


def change_role(
    db: Session, *, actor: Membership, membership_id: uuid.UUID, role: Role
) -> Membership:
    target = _get_target(db, actor, membership_id)
    if target.id == actor.id:
        raise MembershipRuleViolation("You cannot change your own role.", 403)
    if actor.role != Role.OWNER and (role == Role.OWNER or target.role == Role.OWNER):
        raise MembershipRuleViolation("Only an owner can grant or revoke the owner role.", 403)
    if (
        target.role == Role.OWNER
        and role != Role.OWNER
        and _owner_count(db, actor.organization_id) <= 1
    ):
        raise MembershipRuleViolation("The organization must keep at least one owner.")
    previous = target.role
    target.role = role
    audit.record(
        db,
        action="membership.role_changed",
        organization_id=actor.organization_id,
        actor_user_id=actor.user_id,
        actor_membership_id=actor.id,
        entity_type="membership",
        entity_id=target.id,
        data={"from": previous.value, "to": role.value},
    )
    return target


def remove_member(db: Session, *, actor: Membership, membership_id: uuid.UUID) -> None:
    target = _get_target(db, actor, membership_id)
    if target.id == actor.id:
        raise MembershipRuleViolation("You cannot remove yourself.", 403)
    if target.role == Role.OWNER and actor.role != Role.OWNER:
        raise MembershipRuleViolation("Only an owner can remove an owner.", 403)
    if target.role == Role.OWNER and _owner_count(db, actor.organization_id) <= 1:
        raise MembershipRuleViolation("The organization must keep at least one owner.")
    audit.record(
        db,
        action="membership.removed",
        organization_id=actor.organization_id,
        actor_user_id=actor.user_id,
        actor_membership_id=actor.id,
        entity_type="membership",
        entity_id=target.id,
        data={"user_id": str(target.user_id), "role": target.role.value},
    )
    db.delete(target)
