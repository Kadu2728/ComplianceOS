"""core_domain — risks, actions, evidence (decisions D4, D5, D9)

Reviewed after autogenerate: enum types are dropped on downgrade.

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-12 12:31:12.937803

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "risks",
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "category",
            sa.Enum(
                "dados",
                "acesso",
                "seguranca",
                "fornecedores",
                "documentacao",
                "titulares",
                "incidentes",
                "pessoas",
                name="risk_category",
            ),
            nullable=False,
        ),
        sa.Column("probability", sa.SmallInteger(), nullable=False),
        sa.Column("impact", sa.SmallInteger(), nullable=False),
        sa.Column(
            "severity",
            sa.Enum("critico", "alto", "medio", "baixo", name="risk_severity"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum(
                "aberto", "em_andamento", "em_revisao", "resolvido", "aceito", name="risk_status"
            ),
            server_default="aberto",
            nullable=False,
        ),
        sa.Column(
            "source",
            sa.Enum("manual", "assessment", name="risk_source"),
            server_default="manual",
            nullable=False,
        ),
        sa.Column("origin_question_code", sa.String(length=16), nullable=True),
        sa.Column("treatment", sa.Text(), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("owner_membership_id", sa.UUID(), nullable=True),
        sa.Column("created_by_membership_id", sa.UUID(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.CheckConstraint("impact BETWEEN 1 AND 4", name=op.f("ck_risks_impact_range")),
        sa.CheckConstraint("probability BETWEEN 1 AND 3", name=op.f("ck_risks_probability_range")),
        sa.ForeignKeyConstraint(
            ["organization_id", "created_by_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_risks_created_by_membership",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "owner_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_risks_owner_membership",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_risks_organization_id_organizations"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_risks")),
        sa.UniqueConstraint("organization_id", "id", name="uq_risks_org_id"),
    )
    op.create_index(
        "ix_risks_org_owner", "risks", ["organization_id", "owner_membership_id"], unique=False
    )
    op.create_index(
        "ix_risks_org_status_severity",
        "risks",
        ["organization_id", "status", "severity"],
        unique=False,
    )
    op.create_table(
        "actions",
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("risk_id", sa.UUID(), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "a_fazer",
                "em_andamento",
                "em_revisao",
                "concluida",
                "bloqueada",
                name="action_status",
            ),
            server_default="a_fazer",
            nullable=False,
        ),
        sa.Column("owner_membership_id", sa.UUID(), nullable=True),
        sa.Column("created_by_membership_id", sa.UUID(), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
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
            ["organization_id", "created_by_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_actions_created_by_membership",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "owner_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_actions_owner_membership",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "risk_id"],
            ["risks.organization_id", "risks.id"],
            name="fk_actions_risk",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_actions_organization_id_organizations"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_actions")),
        sa.UniqueConstraint("organization_id", "id", name="uq_actions_org_id"),
    )
    op.create_index(
        "ix_actions_org_owner", "actions", ["organization_id", "owner_membership_id"], unique=False
    )
    op.create_index("ix_actions_org_risk", "actions", ["organization_id", "risk_id"], unique=False)
    op.create_index(
        "ix_actions_org_status_due",
        "actions",
        ["organization_id", "status", "due_date"],
        unique=False,
    )
    op.create_table(
        "evidence",
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("risk_id", sa.UUID(), nullable=True),
        sa.Column("action_id", sa.UUID(), nullable=True),
        sa.Column("kind", sa.Enum("note", "link", "file", name="evidence_kind"), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("url", sa.String(length=2048), nullable=True),
        sa.Column("filename", sa.String(length=255), nullable=True),
        sa.Column("content_type", sa.String(length=127), nullable=True),
        sa.Column("size_bytes", sa.BigInteger(), nullable=True),
        sa.Column("storage_key", sa.String(length=512), nullable=True),
        sa.Column("added_by_membership_id", sa.UUID(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.CheckConstraint(
            "risk_id IS NOT NULL OR action_id IS NOT NULL",
            name=op.f("ck_evidence_attached_to_something"),
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "action_id"],
            ["actions.organization_id", "actions.id"],
            name="fk_evidence_action",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "added_by_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_evidence_added_by_membership",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "risk_id"],
            ["risks.organization_id", "risks.id"],
            name="fk_evidence_risk",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_evidence_organization_id_organizations"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_evidence")),
        sa.UniqueConstraint("organization_id", "id", name="uq_evidence_org_id"),
        sa.UniqueConstraint("storage_key", name=op.f("uq_evidence_storage_key")),
    )
    op.create_index(
        "ix_evidence_org_action", "evidence", ["organization_id", "action_id"], unique=False
    )
    op.create_index(
        "ix_evidence_org_risk", "evidence", ["organization_id", "risk_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_evidence_org_risk", table_name="evidence")
    op.drop_index("ix_evidence_org_action", table_name="evidence")
    op.drop_table("evidence")
    op.drop_index("ix_actions_org_status_due", table_name="actions")
    op.drop_index("ix_actions_org_risk", table_name="actions")
    op.drop_index("ix_actions_org_owner", table_name="actions")
    op.drop_table("actions")
    op.drop_index("ix_risks_org_status_severity", table_name="risks")
    op.drop_index("ix_risks_org_owner", table_name="risks")
    op.drop_table("risks")
    for enum_name in (
        "evidence_kind",
        "action_status",
        "risk_source",
        "risk_status",
        "risk_severity",
        "risk_category",
    ):
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")
