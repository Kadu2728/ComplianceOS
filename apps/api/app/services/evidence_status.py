"""Evidence validity (Evidence Vault v1, decision D34): derived, never stored."""

from datetime import date, timedelta

from app.core.config import get_settings
from app.models.domain import Evidence
from app.schemas.domain import EvidenceOut
from app.services.score import today_local

VIGENTE = "vigente"
VENCENDO = "vencendo"
VENCIDA = "vencida"


def derive_validity(valid_until: date | None, today: date | None = None) -> str:
    if valid_until is None:
        return VIGENTE
    today = today or today_local()
    if valid_until < today:
        return VENCIDA
    if valid_until <= today + timedelta(days=get_settings().document_expiring_days):
        return VENCENDO
    return VIGENTE


def evidence_out(row: Evidence, today: date | None = None) -> EvidenceOut:
    out = EvidenceOut.model_validate(row)
    out.validity = derive_validity(row.valid_until, today)
    return out
