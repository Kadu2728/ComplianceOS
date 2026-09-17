from fastapi import APIRouter, HTTPException, Request, Response

from app.api.deps import CurrentUser, DbSession
from app.core.client_ip import client_ip
from app.core.cookies import REFRESH_COOKIE, clear_auth_cookies, set_auth_cookies
from app.core.rate_limit import limiter
from app.schemas.identity import (
    InvitationAccept,
    InvitationAcceptedOut,
    LoginRequest,
    MessageOut,
    PasswordResetConfirm,
    PasswordResetRequest,
    SignupRequest,
    UserOut,
)
from app.services import audit, auth
from app.services.membership import MembershipRuleViolation, accept_invitation

router = APIRouter(prefix="/auth", tags=["auth"])


def _limit(request: Request, key: str, *, limit: int, window: int) -> None:
    if not limiter.check(f"{key}:{client_ip(request)}", limit=limit, window_seconds=window):
        raise HTTPException(status_code=429, detail="Too many attempts. Try again in a minute.")


@router.post(
    "/signup", response_model=UserOut, status_code=201, summary="Create account + organization"
)
def signup(payload: SignupRequest, request: Request, response: Response, db: DbSession) -> UserOut:
    _limit(request, "signup", limit=5, window=60)
    try:
        user, _ = auth.signup(
            db,
            name=payload.name,
            email=payload.email,
            password=payload.password,
            organization_name=payload.organization_name,
        )
    except auth.EmailTaken:
        raise HTTPException(status_code=409, detail="This e-mail is already registered.") from None
    access, refresh = auth.issue_session(db, user)
    db.commit()
    set_auth_cookies(response, access, refresh)
    return UserOut.model_validate(user)


@router.post("/login", response_model=UserOut, summary="Log in with e-mail and password")
def login(payload: LoginRequest, request: Request, response: Response, db: DbSession) -> UserOut:
    _limit(request, "login", limit=10, window=60)
    if not limiter.check(f"login:email:{payload.email.lower()}", limit=5, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many attempts. Try again in a minute.")
    user = auth.authenticate(db, email=payload.email, password=payload.password)
    if user is None:
        audit.record(db, action="auth.login_failed", data={"email": payload.email.lower()})
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid e-mail or password.")
    access, refresh = auth.issue_session(db, user)
    audit.record(
        db, action="auth.login", actor_user_id=user.id, entity_type="user", entity_id=user.id
    )
    db.commit()
    set_auth_cookies(response, access, refresh)
    return UserOut.model_validate(user)


@router.post("/refresh", response_model=UserOut, summary="Rotate the refresh token")
def refresh(request: Request, response: Response, db: DbSession) -> UserOut:
    _limit(request, "refresh", limit=30, window=60)
    token = request.cookies.get(REFRESH_COOKIE)
    result = auth.rotate_refresh(db, token) if token else None
    db.commit()  # persists a reuse-detection revocation even when we fail the request
    if result is None:
        clear_auth_cookies(response)
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    user, access, new_refresh = result
    set_auth_cookies(response, access, new_refresh)
    return UserOut.model_validate(user)


@router.post("/logout", response_model=MessageOut, summary="Log out (revokes the refresh token)")
def logout(request: Request, response: Response, db: DbSession) -> MessageOut:
    token = request.cookies.get(REFRESH_COOKIE)
    if token:
        auth.revoke_refresh(db, token)
        db.commit()
    clear_auth_cookies(response)
    return MessageOut(message="Logged out.")


@router.post(
    "/logout-all", response_model=MessageOut, summary="Revoke every session of the current user"
)
def logout_all(user: CurrentUser, response: Response, db: DbSession) -> MessageOut:
    auth.revoke_all_sessions(db, user.id)
    audit.record(
        db, action="auth.logout_all", actor_user_id=user.id, entity_type="user", entity_id=user.id
    )
    db.commit()
    clear_auth_cookies(response)
    return MessageOut(message="All sessions revoked.")


@router.post("/password-reset/request", response_model=MessageOut, status_code=202)
def password_reset_request(
    payload: PasswordResetRequest, request: Request, db: DbSession
) -> MessageOut:
    _limit(request, "reset", limit=5, window=60)
    if not limiter.check(f"reset:email:{payload.email.lower()}", limit=3, window_seconds=600):
        raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")
    auth.request_password_reset(db, email=payload.email)
    db.commit()
    return MessageOut(message="If the e-mail exists, a reset link was sent.")


@router.post("/password-reset/confirm", response_model=MessageOut)
def password_reset_confirm(
    payload: PasswordResetConfirm, request: Request, db: DbSession
) -> MessageOut:
    _limit(request, "reset-confirm", limit=10, window=60)
    if not auth.confirm_password_reset(db, token=payload.token, password=payload.password):
        raise HTTPException(status_code=400, detail="Reset link is invalid or expired.")
    db.commit()
    return MessageOut(message="Password updated. Please log in again.")


@router.post(
    "/invitations/accept", response_model=InvitationAcceptedOut, summary="Accept an invitation"
)
def invitation_accept(
    payload: InvitationAccept, request: Request, response: Response, db: DbSession
) -> InvitationAcceptedOut:
    _limit(request, "invite-accept", limit=10, window=60)
    try:
        user, membership = accept_invitation(
            db, token=payload.token, name=payload.name, password=payload.password
        )
    except MembershipRuleViolation as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from None
    access, refresh = auth.issue_session(db, user)
    db.commit()
    set_auth_cookies(response, access, refresh)
    return InvitationAcceptedOut(
        id=user.id, email=user.email, name=user.name, organization_id=membership.organization_id
    )
