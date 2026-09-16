"""control graph — controls, risk_controls, profiles, action/evidence links (D27, D28, D34)

Revision ID: 0008
Revises: 0007
Create Date: 2026-09-15
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Composite foreign keys with ON DELETE SET NULL null *every* referencing column — including
# organization_id — so removing a member who owned a risk (or deleting a linked row) failed with a
# NOT NULL violation. PostgreSQL 15+ scopes the null: SET NULL (column). (P1 found in Phase 11.)
SCOPED_SET_NULL = (
    # (table, constraint, referenced table, referencing column)
    ("risks", "fk_risks_owner_membership", "memberships", "owner_membership_id"),
    ("risks", "fk_risks_created_by_membership", "memberships", "created_by_membership_id"),
    ("actions", "fk_actions_risk", "risks", "risk_id"),
    ("actions", "fk_actions_owner_membership", "memberships", "owner_membership_id"),
    ("actions", "fk_actions_created_by_membership", "memberships", "created_by_membership_id"),
    ("evidence", "fk_evidence_added_by_membership", "memberships", "added_by_membership_id"),
    ("documents", "fk_documents_owner_membership", "memberships", "owner_membership_id"),
    ("documents", "fk_documents_created_by_membership", "memberships", "created_by_membership_id"),
    ("assessments", "fk_assessments_started_by", "memberships", "started_by_membership_id"),
    ("assessments", "fk_assessments_completed_by", "memberships", "completed_by_membership_id"),
    (
        "assessment_responses",
        "fk_responses_answered_by",
        "memberships",
        "answered_by_membership_id",
    ),
)


def _recreate_scoped(scoped: bool) -> None:
    for table, name, target, column in SCOPED_SET_NULL:
        op.drop_constraint(name, table, type_="foreignkey")
        op.create_foreign_key(
            name,
            table,
            target,
            ["organization_id", column],
            ["organization_id", "id"],
            ondelete=f"SET NULL ({column})" if scoped else "SET NULL",
        )


NEW_ENUMS = (
    "org_segment",
    "org_headcount_band",
    "org_customer_type",
    "org_tristate",
    "control_kind",
    "control_status",
    "action_effort",
)


def upgrade() -> None:
    _recreate_scoped(scoped=True)
    op.create_table(
        "organization_profiles",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column(
            "segment",
            sa.Enum(
                "software_saas",
                "servicos",
                "comercio",
                "industria",
                "saude",
                "educacao",
                "financeiro",
                "outro",
                name="org_segment",
            ),
            nullable=True,
        ),
        sa.Column(
            "headcount_band",
            sa.Enum(
                "ate_9", "de_10_a_49", "de_50_a_199", "acima_de_200", name="org_headcount_band"
            ),
            nullable=True,
        ),
        sa.Column(
            "customer_type",
            sa.Enum("b2b", "b2c", "ambos", name="org_customer_type"),
            nullable=True,
        ),
        sa.Column(
            "data_categories",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column("sells_to_enterprise", sa.Boolean(), nullable=True),
        sa.Column(
            "international_transfers",
            sa.Enum("sim", "nao", "nao_sei", name="org_tristate"),
            nullable=True,
        ),
        sa.Column(
            "systems", postgresql.JSONB(astext_type=sa.Text()), server_default="[]", nullable=False
        ),
        sa.Column(
            "processes",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column("notes", sa.Text(), nullable=True),
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
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_organization_profiles_organization_id_organizations"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_organization_profiles")),
        sa.UniqueConstraint(
            "organization_id", name=op.f("uq_organization_profiles_organization_id")
        ),
    )
    op.create_table(
        "controls",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        # The enum type already exists (0003); reuse it.
        sa.Column(
            "category",
            postgresql.ENUM(
                "dados",
                "acesso",
                "seguranca",
                "fornecedores",
                "documentacao",
                "titulares",
                "incidentes",
                "pessoas",
                name="risk_category",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column(
            "kind",
            sa.Enum("preventivo", "detectivo", "corretivo", name="control_kind"),
            server_default="preventivo",
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum(
                "planejado",
                "parcial",
                "implementado",
                "verificado",
                "inativo",
                name="control_status",
            ),
            server_default="planejado",
            nullable=False,
        ),
        sa.Column("template_code", sa.String(length=32), nullable=True),
        sa.Column("owner_membership_id", sa.UUID(), nullable=True),
        sa.Column("created_by_membership_id", sa.UUID(), nullable=True),
        sa.Column("document_id", sa.UUID(), nullable=True),
        sa.Column("review_date", sa.Date(), nullable=True),
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
            name="fk_controls_created_by_membership",
            ondelete="SET NULL (created_by_membership_id)",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "document_id"],
            ["documents.organization_id", "documents.id"],
            name="fk_controls_document",
            ondelete="SET NULL (document_id)",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "owner_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_controls_owner_membership",
            ondelete="SET NULL (owner_membership_id)",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_controls_organization_id_organizations"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_controls")),
        sa.UniqueConstraint("organization_id", "id", name="uq_controls_org_id"),
    )
    op.create_index("ix_controls_org_owner", "controls", ["organization_id", "owner_membership_id"])
    op.create_index("ix_controls_org_status", "controls", ["organization_id", "status"])
    op.create_index("ix_controls_org_template", "controls", ["organization_id", "template_code"])
    op.create_table(
        "risk_controls",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("risk_id", sa.UUID(), nullable=False),
        sa.Column("control_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id", "control_id"],
            ["controls.organization_id", "controls.id"],
            name="fk_risk_controls_control",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "risk_id"],
            ["risks.organization_id", "risks.id"],
            name="fk_risk_controls_risk",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_risk_controls_organization_id_organizations"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_risk_controls")),
        sa.UniqueConstraint(
            "organization_id", "risk_id", "control_id", name="uq_risk_controls_pair"
        ),
    )
    op.create_index(
        "ix_risk_controls_org_control", "risk_controls", ["organization_id", "control_id"]
    )
    op.add_column("actions", sa.Column("control_id", sa.UUID(), nullable=True))
    # add_column does not create enum types by itself (create_table does).
    action_effort = sa.Enum("baixo", "medio", "alto", name="action_effort")
    action_effort.create(op.get_bind(), checkfirst=True)
    op.add_column("actions", sa.Column("effort", action_effort, nullable=True))
    op.create_index("ix_actions_org_control", "actions", ["organization_id", "control_id"])
    op.create_foreign_key(
        "fk_actions_control",
        "actions",
        "controls",
        ["organization_id", "control_id"],
        ["organization_id", "id"],
        ondelete="SET NULL (control_id)",
    )
    op.add_column("evidence", sa.Column("control_id", sa.UUID(), nullable=True))
    op.add_column("evidence", sa.Column("valid_until", sa.Date(), nullable=True))
    op.create_index("ix_evidence_org_control", "evidence", ["organization_id", "control_id"])
    op.create_foreign_key(
        "fk_evidence_control",
        "evidence",
        "controls",
        ["organization_id", "control_id"],
        ["organization_id", "id"],
        ondelete="SET NULL (control_id)",
    )
    # Evidence may now hang off a control alone (D34).
    op.drop_constraint(op.f("ck_evidence_attached_to_something"), "evidence", type_="check")
    op.create_check_constraint(
        "attached_to_something",
        "evidence",
        "risk_id IS NOT NULL OR action_id IS NOT NULL OR control_id IS NOT NULL",
    )


def downgrade() -> None:
    op.execute("DELETE FROM evidence WHERE risk_id IS NULL AND action_id IS NULL")
    op.drop_constraint(op.f("ck_evidence_attached_to_something"), "evidence", type_="check")
    op.create_check_constraint(
        "attached_to_something", "evidence", "risk_id IS NOT NULL OR action_id IS NOT NULL"
    )
    op.drop_constraint("fk_evidence_control", "evidence", type_="foreignkey")
    op.drop_index("ix_evidence_org_control", table_name="evidence")
    op.drop_column("evidence", "valid_until")
    op.drop_column("evidence", "control_id")
    op.drop_constraint("fk_actions_control", "actions", type_="foreignkey")
    op.drop_index("ix_actions_org_control", table_name="actions")
    op.drop_column("actions", "effort")
    op.drop_column("actions", "control_id")
    op.drop_index("ix_risk_controls_org_control", table_name="risk_controls")
    op.drop_table("risk_controls")
    op.drop_index("ix_controls_org_template", table_name="controls")
    op.drop_index("ix_controls_org_status", table_name="controls")
    op.drop_index("ix_controls_org_owner", table_name="controls")
    op.drop_table("controls")
    op.drop_table("organization_profiles")
    for name in NEW_ENUMS:
        op.execute(f"DROP TYPE IF EXISTS {name}")
    _recreate_scoped(scoped=False)
