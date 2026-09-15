"""reminders — reminder_deliveries (document-expiry digest bookkeeping, Phase 10)

Revision ID: 0007
Revises: 0006
Create Date: 2026-09-13
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "reminder_deliveries",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("kind", sa.String(length=64), nullable=False),
        sa.Column("sent_on", sa.Date(), nullable=False),
        sa.Column("recipients", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_reminder_deliveries_organization_id_organizations"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_reminder_deliveries")),
        sa.UniqueConstraint(
            "organization_id", "kind", "sent_on", name="uq_reminder_deliveries_org_kind_day"
        ),
    )


def downgrade() -> None:
    op.drop_table("reminder_deliveries")
