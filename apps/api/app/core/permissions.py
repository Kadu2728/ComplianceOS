"""Permission matrix (decision D8) — data, not scattered conditionals.

Roles are ordered by power only for display; authorization never relies on ordering,
always on explicit membership in the set for a given permission.
"""

import enum


class Role(enum.StrEnum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


ALL = frozenset(Role)
MANAGERS = frozenset({Role.OWNER, Role.ADMIN})
CONTRIBUTORS = frozenset({Role.OWNER, Role.ADMIN, Role.MEMBER})

PERMISSIONS: dict[str, frozenset[Role]] = {
    "org.read": ALL,
    "org.update": frozenset({Role.OWNER}),
    "org.delete": frozenset({Role.OWNER}),
    "members.read": ALL,
    "members.read_emails": CONTRIBUTORS,  # VIEWER sees names and roles only
    "members.invite": MANAGERS,
    "members.change_role": MANAGERS,  # ADMIN may not grant or revoke OWNER (checked in service)
    "members.remove": MANAGERS,
    "audit.read": MANAGERS,
    # Domain permissions (Phase 3+). Declared now so the matrix is the single source of truth.
    "assessment.answer": CONTRIBUTORS,
    "risk.create": MANAGERS,
    "risk.update_any": MANAGERS,
    "risk.update_assigned": CONTRIBUTORS,
    "action.create": MANAGERS,
    "action.update_any": MANAGERS,
    "action.update_assigned": CONTRIBUTORS,
    "evidence.upload": CONTRIBUTORS,
    "evidence.delete": MANAGERS,
    "score.read": ALL,
    "document.read": ALL,
    "document.create": MANAGERS,
    "document.update_any": MANAGERS,
    "document.update_assigned": CONTRIBUTORS,  # the document's responsible person
    "document.delete": MANAGERS,
}


def has_permission(role: Role, permission: str) -> bool:
    allowed = PERMISSIONS.get(permission)
    if allowed is None:
        raise KeyError(f"Unknown permission: {permission}")
    return role in allowed
