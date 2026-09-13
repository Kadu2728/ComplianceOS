"""score — snapshots; assessment first_completed_at (decision D10)

Reviewed after autogenerate: `first_completed_at` is backfilled for assessments that were already
completed once (kept `completed_at`, or reopened but with derived risks on record).

Revision ID: 0005
Revises: 0004
Create Date: 2026-09-12 23:02:23.130924

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "score_snapshots",
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("score", sa.SmallInteger(), nullable=False),
        sa.Column("score_version", sa.String(length=16), nullable=False),
        sa.Column("preliminary", sa.Boolean(), nullable=False),
        sa.Column("trigger", sa.String(length=64), nullable=False),
        sa.Column("breakdown", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("computed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_score_snapshots_organization_id_organizations"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_score_snapshots")),
        sa.UniqueConstraint("organization_id", "id", name="uq_score_snapshots_org_id"),
    )
    op.create_index(
        "ix_score_snapshots_org_computed",
        "score_snapshots",
        ["organization_id", "computed_at"],
        unique=False,
    )
    op.add_column(
        "assessments", sa.Column("first_completed_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.execute(
        """
        UPDATE assessments a
        SET first_completed_at = COALESCE(
            a.completed_at,
            (SELECT MIN(r.created_at) FROM risks r
             WHERE r.organization_id = a.organization_id AND r.source = 'assessment')
        )
        WHERE a.first_completed_at IS NULL
        """
    )


def downgrade() -> None:
    op.drop_column("assessments", "first_completed_at")
    op.drop_index("ix_score_snapshots_org_computed", table_name="score_snapshots")
    op.drop_table("score_snapshots")
