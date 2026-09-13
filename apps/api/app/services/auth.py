"""Authentication use cases. Every function runs inside the caller's transaction and records
its audit event in the same transaction; the router commits."""

import uuid
from datetime import timedelta

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.email import EmailMessage, get_email_sender
from app.core.permissions import Role
from app.core.security import (
    create_access_token,
    hash_password,
    hash_token,
    new_opaque_token,
    utcnow,
    verify_password,
)
from app.models.auth import PasswordResetToken, RefreshToken
from app.models.membership import Membership
from app.models.organization import Organization
from app.models.user import User
from app.services import audit

# Verifying against a real hash when the e-mail is unknown keeps login timing uniform.
_DUMMY_HASH = hash_password("dummy-password-for-timing")


class EmailTaken(Exception):
    pass


def normalize_email(email: str) -> str:
    return email.strip().lower()


def find_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == normalize_email(email)))


def signup(
    db: Session, *, name: str, email: str, password: str, organization_name: str
) -> tuple[User, Membership]:
    """Create user + organization + OWNER membership atomically (SSE file §36)."""
    email = normalize_email(email)
    if find_user_by_email(db, email) is not None:
        raise EmailTaken
    user = User(email=email, name=name, password_hash=hash_password(password))
    org = Organization(name=organization_name)
    db.add_all([user, org])
    db.flush()
    membership = Membership(organization_id=org.id, user_id=user.id, role=Role.OWNER)
    db.add(membership)
    db.flush()
    audit.record(
        db, action="user.signup", actor_user_id=user.id, entity_type="user", entity_id=user.id
    )
    audit.record(
        db,
        action="organization.created",
        organization_id=org.id,
        actor_user_id=user.id,
        actor_membership_id=membership.id,
        entity_type="organization",
        entity_id=org.id,
        data={"name": org.name},
    )
    return user, membership


def authenticate(db: Session, *, email: str, password: str) -> User | None:
    user = find_user_by_email(db, email)
    if user is None or not user.is_active:
        verify_password(password, _DUMMY_HASH)
        return None
    return user if verify_password(password, user.password_hash) else None


def issue_session(
    db: Session, user: User, *, family_id: uuid.UUID | None = None
) -> tuple[str, str]:
    """Return (access_token, refresh_token). The refresh token is stored hashed."""
    s = get_settings()
    refresh_plain = new_opaque_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            family_id=family_id or uuid.uuid4(),
            token_hash=hash_token(refresh_plain),
            expires_at=utcnow() + timedelta(days=s.refresh_token_ttl_days),
        )
    )
    return create_access_token(user.id), refresh_plain


def rotate_refresh(db: Session, refresh_plain: str) -> tuple[User, str, str] | None:
    """Rotate a refresh token. Reuse of a revoked token revokes its whole family."""
    row = db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == hash_token(refresh_plain))
    )
    if row is None:
        return None
    now = utcnow()
    if row.revoked_at is not None:
        db.execute(
            update(RefreshToken)
            .where(RefreshToken.family_id == row.family_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        audit.record(
            db,
            action="auth.refresh_reuse_detected",
            actor_user_id=row.user_id,
            entity_type="refresh_family",
            entity_id=row.family_id,
        )
        return None
    if row.expires_at <= now:
        return None
    user = db.get(User, row.user_id)
    if user is None or not user.is_active:
        return None
    row.revoked_at = now
    access, refresh = issue_session(db, user, family_id=row.family_id)
    return user, access, refresh


def revoke_refresh(db: Session, refresh_plain: str) -> None:
    db.execute(
        update(RefreshToken)
        .where(
            RefreshToken.token_hash == hash_token(refresh_plain), RefreshToken.revoked_at.is_(None)
        )
        .values(revoked_at=utcnow())
    )


def revoke_all_sessions(db: Session, user_id: uuid.UUID) -> None:
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=utcnow())
    )


def request_password_reset(db: Session, *, email: str) -> None:
    """Always succeeds from the caller's point of view (no account enumeration)."""
    user = find_user_by_email(db, email)
    if user is None or not user.is_active:
        return
    s = get_settings()
    token = new_opaque_token()
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(token),
            expires_at=utcnow() + timedelta(minutes=s.password_reset_ttl_minutes),
        )
    )
    audit.record(
        db,
        action="auth.password_reset_requested",
        actor_user_id=user.id,
        entity_type="user",
        entity_id=user.id,
    )
    get_email_sender().send(
        EmailMessage(
            to=user.email,
            subject="Redefinição de senha — Compliance OS",
            text=(
                f"Olá, {user.name}.\n\nPara definir uma nova senha, acesse:\n"
                f"{s.app_base_url}/redefinir-senha?token={token}\n\n"
                f"O link expira em {s.password_reset_ttl_minutes} minutos. "
                "Se você não pediu isso, ignore esta mensagem."
            ),
        )
    )


def confirm_password_reset(db: Session, *, token: str, password: str) -> bool:
    row = db.scalar(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == hash_token(token))
    )
    now = utcnow()
    if row is None or row.used_at is not None or row.expires_at <= now:
        return False
    user = db.get(User, row.user_id)
    if user is None or not user.is_active:
        return False
    user.password_hash = hash_password(password)
    row.used_at = now
    revoke_all_sessions(db, user.id)
    audit.record(
        db,
        action="auth.password_reset_completed",
        actor_user_id=user.id,
        entity_type="user",
        entity_id=user.id,
    )
    return True
