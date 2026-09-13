"""assessment — template versions, questions, sections, assessments, responses; risk columns

Reviewed after autogenerate: the risk_category enum is reused (not recreated); the new enum
types are dropped on downgrade.

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-12 13:08:22.622027

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "assessment_templates",
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_assessment_templates")),
        sa.UniqueConstraint("code", name=op.f("uq_assessment_templates_code")),
    )
    op.create_table(
        "assessment_template_versions",
        sa.Column("template_id", sa.UUID(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("changelog", sa.Text(), nullable=True),
        sa.Column("content_source", sa.String(length=255), nullable=True),
        sa.Column("last_verified", sa.Date(), nullable=True),
        sa.Column(
            "published_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["template_id"],
            ["assessment_templates.id"],
            name=op.f("fk_assessment_template_versions_template_id_assessment_templates"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_assessment_template_versions")),
        sa.UniqueConstraint("template_id", "version", name="uq_template_versions_version"),
    )
    op.create_table(
        "assessment_questions",
        sa.Column("template_version_id", sa.UUID(), nullable=False),
        sa.Column("code", sa.String(length=16), nullable=False),
        sa.Column("section_number", sa.SmallInteger(), nullable=False),
        sa.Column("order", sa.SmallInteger(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("help_text", sa.Text(), nullable=False),
        sa.Column("needs_verification", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("answer_type", sa.String(length=32), server_default="scale_v1", nullable=False),
        sa.Column("short_mode", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("impact", sa.SmallInteger(), nullable=False),
        sa.Column("weight", sa.SmallInteger(), server_default="1", nullable=False),
        sa.Column("expected_evidence", sa.Text(), nullable=True),
        sa.Column("derived_risk_title", sa.String(length=200), nullable=False),
        sa.Column(
            "derived_risk_category",
            postgresql.ENUM(name="risk_category", create_type=False),
            nullable=False,
        ),
        sa.Column("remediation_action_title", sa.String(length=200), nullable=False),
        sa.Column("regulatory_basis", sa.Text(), nullable=True),
        sa.Column("classification", sa.String(length=32), nullable=True),
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["template_version_id"],
            ["assessment_template_versions.id"],
            name=op.f("fk_assessment_questions_template_version_id_assessment_template_versions"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_assessment_questions")),
        sa.UniqueConstraint("template_version_id", "code", name="uq_questions_version_code"),
    )
    op.create_index(
        "ix_questions_version_section",
        "assessment_questions",
        ["template_version_id", "section_number", "order"],
        unique=False,
    )
    op.create_table(
        "assessment_sections",
        sa.Column("template_version_id", sa.UUID(), nullable=False),
        sa.Column("number", sa.SmallInteger(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["template_version_id"],
            ["assessment_template_versions.id"],
            name=op.f("fk_assessment_sections_template_version_id_assessment_template_versions"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_assessment_sections")),
        sa.UniqueConstraint("template_version_id", "number", name="uq_sections_version_number"),
    )
    op.create_table(
        "assessments",
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("template_version_id", sa.UUID(), nullable=False),
        sa.Column("mode", sa.Enum("short", "full", name="assessment_mode"), nullable=False),
        sa.Column(
            "status",
            sa.Enum("in_progress", "completed", name="assessment_status"),
            server_default="in_progress",
            nullable=False,
        ),
        sa.Column("started_by_membership_id", sa.UUID(), nullable=True),
        sa.Column("completed_by_membership_id", sa.UUID(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "completed_by_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_assessments_completed_by",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "started_by_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_assessments_started_by",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_assessments_organization_id_organizations"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["template_version_id"],
            ["assessment_template_versions.id"],
            name=op.f("fk_assessments_template_version_id_assessment_template_versions"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_assessments")),
        sa.UniqueConstraint("organization_id", "id", name="uq_assessments_org_id"),
        sa.UniqueConstraint(
            "organization_id", "template_version_id", name="uq_assessments_org_version"
        ),
    )
    op.create_table(
        "assessment_responses",
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("assessment_id", sa.UUID(), nullable=False),
        sa.Column("question_id", sa.UUID(), nullable=False),
        sa.Column(
            "value",
            sa.Enum("sim", "parcial", "nao", "nao_se_aplica", "nao_sei", name="answer_value"),
            nullable=False,
        ),
        sa.Column("justification", sa.Text(), nullable=True),
        sa.Column("answered_by_membership_id", sa.UUID(), nullable=True),
        sa.Column(
            "answered_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id", "answered_by_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_responses_answered_by",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "assessment_id"],
            ["assessments.organization_id", "assessments.id"],
            name="fk_responses_assessment",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_assessment_responses_organization_id_organizations"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["question_id"],
            ["assessment_questions.id"],
            name=op.f("fk_assessment_responses_question_id_assessment_questions"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_assessment_responses")),
        sa.UniqueConstraint(
            "assessment_id", "question_id", name="uq_responses_assessment_question"
        ),
    )
    op.create_index(
        "ix_responses_org_assessment",
        "assessment_responses",
        ["organization_id", "assessment_id"],
        unique=False,
    )
    op.add_column("risks", sa.Column("derived_probability", sa.SmallInteger(), nullable=True))
    op.add_column("risks", sa.Column("derived_impact", sa.SmallInteger(), nullable=True))
    op.add_column(
        "risks", sa.Column("answer_uncertain", sa.Boolean(), server_default="false", nullable=False)
    )
    op.add_column("risks", sa.Column("suggested_action", sa.String(length=200), nullable=True))
    op.add_column("risks", sa.Column("expected_evidence", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("risks", "expected_evidence")
    op.drop_column("risks", "suggested_action")
    op.drop_column("risks", "answer_uncertain")
    op.drop_column("risks", "derived_impact")
    op.drop_column("risks", "derived_probability")
    op.drop_index("ix_responses_org_assessment", table_name="assessment_responses")
    op.drop_table("assessment_responses")
    op.drop_table("assessments")
    op.drop_table("assessment_sections")
    op.drop_index("ix_questions_version_section", table_name="assessment_questions")
    op.drop_table("assessment_questions")
    op.drop_table("assessment_template_versions")
    op.drop_table("assessment_templates")
    for enum_name in ("answer_value", "assessment_status", "assessment_mode"):
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")
