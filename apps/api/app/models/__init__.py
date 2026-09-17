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
from app.models.control import Control, RiskControl
from app.models.document import Document
from app.models.domain import Action, Evidence, Risk
from app.models.membership import Membership
from app.models.organization import Organization
from app.models.profile import OrganizationProfile
from app.models.reminder import ReminderDelivery
from app.models.room import ComplianceRoom, RoomLink
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
    "ComplianceRoom",
    "Control",
    "Document",
    "Evidence",
    "Invitation",
    "Membership",
    "Organization",
    "OrganizationProfile",
    "ReminderDelivery",
    "RiskControl",
    "RoomLink",
    "PasswordResetToken",
    "RefreshToken",
    "Risk",
    "ScoreSnapshot",
    "User",
]
