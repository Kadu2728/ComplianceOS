"""Global search (dashboard v2): one round trip for the search dropdown.

Matches the title (documents: the name) of the caller's organization's risks, actions, controls
and documents, case- and accent-insensitively and without a database extension: the column and
the user's text go through the same folding (`lower` + `translate` of Portuguese accented letters),
and the text is used as a LIKE literal with `%`, `_` and `\\` escaped — always as a bound
parameter. Read-only: no audit entry, and the query text is never logged here.

Every readable group is always present (total 0 when nothing matches) so the client can render a
predictable shape. Nothing is soft-deleted or archived in these tables, and the list routes return
every row (inactive controls included), so neither does search.
"""

import unicodedata
import uuid
from collections.abc import Sequence
from datetime import date
from typing import Annotated, Any, Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, StringConstraints
from sqlalchemy import ColumnElement, Row, func, select
from sqlalchemy.orm import InstrumentedAttribute, Session

from app.api.deps import CurrentMembership, DbSession
from app.core.permissions import has_permission
from app.core.rate_limit import limiter
from app.models.control import Control, ControlStatus
from app.models.document import Document, DocumentStatus
from app.models.domain import (
    Action,
    ActionStatus,
    Risk,
    RiskCategory,
    RiskSeverity,
    RiskStatus,
)
from app.services import documents as documents_svc
from app.services.score import today_local

router = APIRouter(tags=["search"])

# Portuguese accented letters folded to ASCII. The upper-case forms are listed as well, so the SQL
# side does not depend on the database's LC_CTYPE for `lower()` of non-ASCII letters (a `C`
# locale lower-cases ASCII only).
_ACCENTED = "áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ"
_FOLDED = "aaaaaeeeeiiiiooooouuuuc" * 2
_FOLD_TABLE = str.maketrans(_ACCENTED, _FOLDED)
_LIKE_ESCAPE = "\\"

DEFAULT_LIMIT = 5
SEARCH_PER_MINUTE = 60  # per membership
MAX_LIMIT = 10

# Stripped before the length check; NUL is refused because PostgreSQL text cannot hold it.
SearchText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=2, max_length=100, pattern=r"^[^\x00]*$"),
]


def fold(text: str) -> str:
    """Python side of the folding. NFC first so a decomposed "ção" folds like the composed one."""
    return unicodedata.normalize("NFC", text).lower().translate(_FOLD_TABLE)


def fold_sql(column: ColumnElement[str] | InstrumentedAttribute[str]) -> ColumnElement[str]:
    """SQL side of the folding: `translate(lower(column), <accented>, <folded>)`."""
    return func.translate(func.lower(column), _ACCENTED, _FOLDED)


def like_pattern(text: str) -> str:
    """`%<text>%` with the LIKE metacharacters of the user's text escaped."""
    escaped = (
        text.replace(_LIKE_ESCAPE, _LIKE_ESCAPE * 2)
        .replace("%", _LIKE_ESCAPE + "%")
        .replace("_", _LIKE_ESCAPE + "_")
    )
    return f"%{escaped}%"


# --- response ---


class RiskHit(BaseModel):
    id: uuid.UUID
    title: str
    severity: RiskSeverity
    status: RiskStatus
    category: RiskCategory


class ActionHit(BaseModel):
    id: uuid.UUID
    title: str
    status: ActionStatus
    due_date: date | None


class ControlHit(BaseModel):
    id: uuid.UUID
    title: str
    status: ControlStatus


class DocumentHit(BaseModel):
    id: uuid.UUID
    title: str  # the document's name
    status: DocumentStatus  # derived (services/documents.derive_status), never stored


class RiskGroup(BaseModel):
    kind: Literal["risk"]
    total: int  # every match in the organization, not only the items returned
    items: list[RiskHit]


class ActionGroup(BaseModel):
    kind: Literal["action"]
    total: int
    items: list[ActionHit]


class ControlGroup(BaseModel):
    kind: Literal["control"]
    total: int
    items: list[ControlHit]


class DocumentGroup(BaseModel):
    kind: Literal["document"]
    total: int
    items: list[DocumentHit]


SearchGroup = Annotated[
    RiskGroup | ActionGroup | ControlGroup | DocumentGroup, Field(discriminator="kind")
]


class SearchOut(BaseModel):
    query: str  # the text as matched (trimmed)
    total: int  # sum of the group totals
    groups: list[SearchGroup]  # risk, action, control, document — each readable one, always


# --- route ---


@router.get("/orgs/{org_id}/search", response_model=SearchOut)
def search(
    db: DbSession,
    membership: CurrentMembership,
    q: Annotated[SearchText, Query(description="2–100 characters after trimming.")],
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT, description="Items per group.")] = (
        DEFAULT_LIMIT
    ),
) -> SearchOut:
    # Each keystroke scans the organization's rows four times (QA 2026-09-27: 72–94 ms at 10k
    # rows); the debounced client stays far below this ceiling, a script does not.
    if not limiter.check(f"search:{membership.id}", limit=SEARCH_PER_MINUTE, window_seconds=60):
        raise HTTPException(
            status_code=429, detail="Muitas buscas em sequência. Aguarde alguns segundos."
        )
    org_id = membership.organization_id
    pattern = like_pattern(fold(q))
    role = membership.role
    groups: list[RiskGroup | ActionGroup | ControlGroup | DocumentGroup] = []

    if has_permission(role, "risk.read"):
        rows, total = _matches(
            db,
            Risk,
            Risk.title,
            (Risk.id, Risk.title, Risk.severity, Risk.status, Risk.category),
            org_id=org_id,
            pattern=pattern,
            limit=limit,
        )
        groups.append(
            RiskGroup(
                kind="risk",
                total=total,
                items=[
                    RiskHit(
                        id=r.id,
                        title=r.title,
                        severity=r.severity,
                        status=r.status,
                        category=r.category,
                    )
                    for r in rows
                ],
            )
        )

    if has_permission(role, "action.read"):
        rows, total = _matches(
            db,
            Action,
            Action.title,
            (Action.id, Action.title, Action.status, Action.due_date),
            org_id=org_id,
            pattern=pattern,
            limit=limit,
        )
        groups.append(
            ActionGroup(
                kind="action",
                total=total,
                items=[
                    ActionHit(id=r.id, title=r.title, status=r.status, due_date=r.due_date)
                    for r in rows
                ],
            )
        )

    if has_permission(role, "control.read"):
        rows, total = _matches(
            db,
            Control,
            Control.title,
            (Control.id, Control.title, Control.status),
            org_id=org_id,
            pattern=pattern,
            limit=limit,
        )
        groups.append(
            ControlGroup(
                kind="control",
                total=total,
                items=[ControlHit(id=r.id, title=r.title, status=r.status) for r in rows],
            )
        )

    if has_permission(role, "document.read"):
        rows, total = _matches(
            db,
            Document,
            Document.name,
            (Document.id, Document.name, Document.review_state, Document.valid_until),
            org_id=org_id,
            pattern=pattern,
            limit=limit,
        )
        today = today_local()
        groups.append(
            DocumentGroup(
                kind="document",
                total=total,
                items=[
                    DocumentHit(
                        id=r.id,
                        title=r.name,
                        status=documents_svc.derive_status(r.review_state, r.valid_until, today),
                    )
                    for r in rows
                ],
            )
        )

    return SearchOut(query=q, total=sum(g.total for g in groups), groups=groups)


def _matches(
    db: Session,
    model: type[Risk] | type[Action] | type[Control] | type[Document],
    title: InstrumentedAttribute[str],
    columns: Sequence[InstrumentedAttribute[Any]],
    *,
    org_id: uuid.UUID,
    pattern: str,
    limit: int,
) -> tuple[Sequence[Row[Any]], int]:
    """Up to `limit` matches, most recently updated first, plus the full match count.

    `count(*) OVER ()` is evaluated before LIMIT, so every returned row carries the total number
    of matches; no row means no match. One query per group, only the columns the dropdown needs.
    """
    rows = db.execute(
        select(*columns, func.count().over().label("match_total"))
        .where(
            model.organization_id == org_id,
            fold_sql(title).like(pattern, escape=_LIKE_ESCAPE),
        )
        .order_by(model.updated_at.desc(), model.id)
        .limit(limit)
    ).all()
    return rows, (rows[0].match_total if rows else 0)
