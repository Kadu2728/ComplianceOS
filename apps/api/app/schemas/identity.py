import uuid
from datetime import datetime
from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints

from app.core.permissions import Role

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=120)]
OrgName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=160)]
Password = Annotated[str, StringConstraints(min_length=10, max_length=256)]
Token = Annotated[str, StringConstraints(min_length=16, max_length=128)]


class SignupRequest(BaseModel):
    name: Name
    email: EmailStr
    password: Password
    organization_name: OrgName


class LoginRequest(BaseModel):
    email: EmailStr
    password: Annotated[str, StringConstraints(min_length=1, max_length=256)]


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: Token
    password: Password


class InvitationAccept(BaseModel):
    token: Token
    # Required only when the invited e-mail has no account yet.
    name: Name | None = None
    password: Password | None = None


class InviteRequest(BaseModel):
    email: EmailStr
    role: Role


class RoleUpdate(BaseModel):
    role: Role


class OrganizationUpdate(BaseModel):
    name: OrgName


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: str
    name: str


class InvitationAcceptedOut(UserOut):
    """The account plus the organization joined, so the app can open that organization."""

    organization_id: uuid.UUID


class OrganizationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    created_at: datetime


class MembershipOut(BaseModel):
    id: uuid.UUID
    role: Role
    organization: OrganizationOut


class MeOut(BaseModel):
    user: UserOut
    memberships: list[MembershipOut]


class MemberUserOut(BaseModel):
    id: uuid.UUID
    name: str
    email: str | None = None  # hidden for roles without members.read_emails


class MemberOut(BaseModel):
    id: uuid.UUID
    role: Role
    user: MemberUserOut
    created_at: datetime


class InvitationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: str
    role: Role
    expires_at: datetime
    accepted_at: datetime | None


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    action: str
    entity_type: str | None
    entity_id: uuid.UUID | None
    entity_title: str | None = None  # current title of the risk/action, resolved at read time
    actor_user_id: uuid.UUID | None
    actor_membership_id: uuid.UUID | None
    actor_name: str | None = None
    data: dict[str, Any] | None
    request_id: str | None
    created_at: datetime


class Page[T](BaseModel):
    items: list[T]
    total: int
    limit: int = Field(ge=1, le=50)
    offset: int = Field(ge=0)


class MessageOut(BaseModel):
    message: str
