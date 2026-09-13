"""Load assessment template content (app/content/*.json) into the database, idempotently.

A published version is immutable: if (template code, version) already exists nothing is changed.
Content edits require a new version number. Run: `uv run python scripts/seed_content.py`.
"""

import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.assessment import (
    AssessmentQuestion,
    AssessmentSection,
    AssessmentTemplate,
    AssessmentTemplateVersion,
)
from app.models.domain import RiskCategory

CONTENT_DIR = Path(__file__).resolve().parent


def seed_assessment_templates(db: Session) -> list[str]:
    """Return the list of (code@version) inserted. Existing versions are left untouched."""
    inserted: list[str] = []
    for path in sorted(CONTENT_DIR.glob("assessment_*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        template = db.scalar(
            select(AssessmentTemplate).where(AssessmentTemplate.code == data["template_code"])
        )
        if template is None:
            template = AssessmentTemplate(code=data["template_code"], title=data["title"])
            db.add(template)
            db.flush()
        exists = db.scalar(
            select(AssessmentTemplateVersion.id).where(
                AssessmentTemplateVersion.template_id == template.id,
                AssessmentTemplateVersion.version == data["version"],
            )
        )
        if exists is not None:
            continue
        version = AssessmentTemplateVersion(
            template_id=template.id,
            version=data["version"],
            title=data["title"],
            changelog=data.get("changelog"),
            content_source=data.get("content_source"),
            last_verified=data.get("last_verified"),
        )
        db.add(version)
        db.flush()
        for s in data["sections"]:
            db.add(
                AssessmentSection(template_version_id=version.id, number=s["id"], name=s["name"])
            )
        for q in data["questions"]:
            db.add(
                AssessmentQuestion(
                    template_version_id=version.id,
                    code=q["code"],
                    section_number=q["section"],
                    order=q["order"],
                    text=q["text"],
                    help_text=q["help_text"],
                    needs_verification=q["needs_verification"],
                    answer_type=q["answer_type"],
                    short_mode=q["short_mode"],
                    impact=q["impact"],
                    weight=q["weight"],
                    expected_evidence=q["expected_evidence"],
                    derived_risk_title=q["derived_risk_title"],
                    derived_risk_category=RiskCategory(q["derived_risk_category"]),
                    remediation_action_title=q["remediation_action_title"],
                    regulatory_basis=q.get("regulatory_basis"),
                    classification=q.get("classification"),
                )
            )
        inserted.append(f"{data['template_code']}@{data['version']}")
    db.commit()
    return inserted
