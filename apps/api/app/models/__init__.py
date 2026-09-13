"""Import every model so `Base.metadata` is complete for Alembic and tests."""

from app.models.assessment import (
    Assessment,
    AssessmentQuestion,
    AssessmentResponse,
    AssessmentSection,
    AssessmentTemplate,
    AssessmentTemplateVersion,
)
from app.models.audit import AuditLog
from app.models.auth import Invitation, PasswordResetToken, RefreshToken
from app.models.document import Document
from app.models.domain import Action, Evidence, Risk
from app.models.membership import Membership
from app.models.organization import Organization
from app.models.score import ScoreSnapshot
from app.models.user import User

__all__ = [
    "Action",
    "Assessment",
    "AssessmentQuestion",
    "AssessmentResponse",
    "AssessmentSection",
    "AssessmentTemplate",
    "AssessmentTemplateVersion",
    "AuditLog",
    "Document",
    "Evidence",
    "Invitation",
    "Membership",
    "Organization",
    "PasswordResetToken",
    "RefreshToken",
    "Risk",
    "ScoreSnapshot",
    "User",
]
