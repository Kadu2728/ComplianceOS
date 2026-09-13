"""documents — table, evidence.document_id, evidence_kind 'document' (decision D26)

Reviewed after autogenerate: the `evidence_kind` enum gains the value 'document' (autogenerate does
not diff enum values). PostgreSQL cannot drop an enum value, so the downgrade leaves it in place —
harmless, since the column is dropped and no row can carry it.

Revision ID: 0006
Revises: 0005
Create Date: 2026-09-13 09:41:04.775372

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "documents",
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "category",
            sa.Enum(
                "politica",
                "procedimento",
                "contrato",
                "registro",
                "treinamento",
                "certificacao",
                "outro",
                name="document_category",
            ),
            nullable=False,
        ),
        sa.Column("version", sa.String(length=32), server_default="1.0", nullable=False),
        sa.Column(
            "review_state",
            sa.Enum("vigente", "em_revisao", "faltante", name="document_review_state"),
            server_default="vigente",
            nullable=False,
        ),
        sa.Column("owner_membership_id", sa.UUID(), nullable=True),
        sa.Column("created_by_membership_id", sa.UUID(), nullable=True),
        sa.Column("valid_until", sa.Date(), nullable=True),
        sa.Column(
            "tags", postgresql.JSONB(astext_type=sa.Text()), server_default="[]", nullable=False
        ),
        sa.Column("url", sa.String(length=2048), nullable=True),
        sa.Column("filename", sa.String(length=255), nullable=True),
        sa.Column("content_type", sa.String(length=127), nullable=True),
        sa.Column("size_bytes", sa.BigInteger(), nullable=True),
        sa.Column("storage_key", sa.String(length=512), nullable=True),
        sa.Column("file_updated_at", sa.DateTime(timezone=True), nullable=True),
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
            name="fk_documents_created_by_membership",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "owner_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_documents_owner_membership",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_documents_organization_id_organizations"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_documents")),
        sa.UniqueConstraint("organization_id", "id", name="uq_documents_org_id"),
        sa.UniqueConstraint("storage_key", name=op.f("uq_documents_storage_key")),
    )
    op.create_index(
        "ix_documents_org_category", "documents", ["organization_id", "category"], unique=False
    )
    op.create_index(
        "ix_documents_org_owner",
        "documents",
        ["organization_id", "owner_membership_id"],
        unique=False,
    )
    op.create_index(
        "ix_documents_org_valid_until",
        "documents",
        ["organization_id", "valid_until"],
        unique=False,
    )
    op.execute("ALTER TYPE evidence_kind ADD VALUE IF NOT EXISTS 'document'")
    op.add_column("evidence", sa.Column("document_id", sa.UUID(), nullable=True))
    op.create_index(
        "ix_evidence_org_document", "evidence", ["organization_id", "document_id"], unique=False
    )
    op.create_foreign_key(
        "fk_evidence_document",
        "evidence",
        "documents",
        ["organization_id", "document_id"],
        ["organization_id", "id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    op.drop_constraint("fk_evidence_document", "evidence", type_="foreignkey")
    op.drop_index("ix_evidence_org_document", table_name="evidence")
    op.drop_column("evidence", "document_id")
    op.drop_index("ix_documents_org_valid_until", table_name="documents")
    op.drop_index("ix_documents_org_owner", table_name="documents")
    op.drop_index("ix_documents_org_category", table_name="documents")
    op.drop_table("documents")
    sa.Enum(name="document_review_state").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="document_category").drop(op.get_bind(), checkfirst=True)
