"""Request-scoped dependencies: database session, current user, tenant membership, permissions.

Tenant rule (decision D3): `org_id` in the path is a *selector*. Access is granted only when a
Membership(user, org) exists; anything else is 404 so that organization ids are never confirmed.
"""

import uuid
from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.cookies import ACCESS_COOKIE
from app.core.permissions import has_permission
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.membership import Membership
from app.models.user import User

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(request: Request, db: DbSession) -> User:
    token = request.cookies.get(ACCESS_COOKIE)
    user_id = decode_access_token(token) if token else None
    user = db.get(User, user_id) if user_id else None
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Authentication required.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_membership(org_id: uuid.UUID, user: CurrentUser, db: DbSession) -> Membership:
    membership = db.scalar(
        select(Membership).where(
            Membership.organization_id == org_id, Membership.user_id == user.id
        )
    )
    if membership is None:
        raise HTTPException(status_code=404, detail="Not Found")
    return membership


CurrentMembership = Annotated[Membership, Depends(get_membership)]


def require(permission: str) -> Callable[[Membership], Membership]:
    """Dependency factory: `membership: Membership = Depends(require("members.invite"))`."""

    def _check(membership: CurrentMembership) -> Membership:
        if not has_permission(membership.role, permission):
            raise HTTPException(
                status_code=403, detail="You do not have permission for this action."
            )
        return membership

    return _check
