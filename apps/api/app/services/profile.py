"""Organization profile — Compliance DNA v1 (decision D28)."""

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import has_permission
from app.models.membership import Membership
from app.models.profile import SENSITIVE_DATA, DataCategory, OrganizationProfile
from app.services.domain import DomainRuleViolation, _audit, _plain

MAX_LIST_ITEMS = 20
MAX_ITEM_LENGTH = 80


def get_or_create(db: Session, organization_id: uuid.UUID) -> OrganizationProfile:
    profile = db.scalar(
        select(OrganizationProfile).where(OrganizationProfile.organization_id == organization_id)
    )
    if profile is None:
        profile = OrganizationProfile(organization_id=organization_id)
        db.add(profile)
        db.flush()
    return profile


def _normalize_list(values: list[str] | None, field: str) -> list[str]:
    out: list[str] = []
    for raw in values or []:
        item = " ".join(str(raw).split())
        if not item:
            continue
        if len(item) > MAX_ITEM_LENGTH:
            raise DomainRuleViolation(f"{field}: at most {MAX_ITEM_LENGTH} chars per item.", 422)
        if item.lower() not in {o.lower() for o in out}:
            out.append(item)
    if len(out) > MAX_LIST_ITEMS:
        raise DomainRuleViolation(f"{field}: at most {MAX_LIST_ITEMS} items.", 422)
    return out


def update(db: Session, actor: Membership, changes: dict[str, Any]) -> OrganizationProfile:
    if not has_permission(actor.role, "profile.update"):
        raise DomainRuleViolation("You do not have permission to edit the profile.", 403)
    profile = get_or_create(db, actor.organization_id)
    if "systems" in changes:
        changes["systems"] = _normalize_list(changes["systems"], "systems")
    if "processes" in changes:
        changes["processes"] = _normalize_list(changes["processes"], "processes")
    if "data_categories" in changes:
        cats = []
        for c in changes["data_categories"] or []:
            value = c.value if hasattr(c, "value") else str(c)
            if value not in cats:
                cats.append(value)
        changes["data_categories"] = cats
    diff: dict[str, Any] = {}
    for field, value in changes.items():
        before = getattr(profile, field)
        if before != value:
            diff[field] = {"from": _plain(before), "to": _plain(value)}
            setattr(profile, field, value)
    if diff:
        _audit(db, actor, "profile.updated", "organization", actor.organization_id, diff)
    return profile


# --- context used by the engines (D30) ---------------------------------------------------------


def handles_sensitive_data(profile: OrganizationProfile | None) -> bool:
    if profile is None:
        return False
    known = {c.value for c in DataCategory}
    return any(DataCategory(c) in SENSITIVE_DATA for c in profile.data_categories if c in known)


def exposure_multiplier(
    profile: OrganizationProfile | None, category: str
) -> tuple[float, str | None]:
    """How much the organization's context amplifies a risk of this category — and why, in
    plain language. 1.0 when nothing in the profile applies. Never a legal statement."""
    if profile is None:
        return 1.0, None
    sensitive = handles_sensitive_data(profile)
    if category in ("dados", "titulares", "seguranca", "acesso") and sensitive:
        return 1.5, "trata dados sensíveis ou de crianças/adolescentes"
    if category in ("documentacao", "pessoas") and profile.sells_to_enterprise:
        return 1.25, "vende para empresas maiores, que pedem comprovação"
    if category == "fornecedores" and (
        profile.international_transfers is None or profile.international_transfers.value != "nao"
    ):
        return 1.25, "transferências internacionais não descartadas no perfil"
    consumer = profile.customer_type is not None and profile.customer_type.value != "b2b"
    if category == "incidentes" and consumer:
        return 1.25, "atende pessoas físicas (B2C)"
    return 1.0, None
