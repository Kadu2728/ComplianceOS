"""Compliance Room (decision D36): rooms, time-boxed links, shared_in_room flags.

Revision ID: 0009
Revises: 0008
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0009"
down_revision: str | None = "0008"
branch_labels = None
depends_on = None


def _uuid_pk() -> sa.Column:
    return sa.Column(
        "id",
        postgresql.UUID(as_uuid=True),
        server_default=sa.text("gen_random_uuid()"),
        nullable=False,
    )


def _stamps() -> list[sa.Column]:
    now = sa.text("now()")
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=now, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=now, nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "compliance_rooms",
        _uuid_pk(),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("enabled", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("title", sa.String(length=120), nullable=True),
        sa.Column("intro", sa.Text(), nullable=True),
        sa.Column("show_score", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("show_controls", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("contact_email", sa.String(length=254), nullable=True),
        *_stamps(),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_compliance_rooms_organization_id_organizations"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_compliance_rooms")),
        sa.UniqueConstraint("organization_id", name=op.f("uq_compliance_rooms_organization_id")),
        sa.UniqueConstraint("organization_id", "id", name="uq_compliance_rooms_org_id"),
    )
    op.create_table(
        "room_links",
        _uuid_pk(),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("room_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("label", sa.String(length=80), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_membership_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("view_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("last_viewed_at", sa.DateTime(timezone=True), nullable=True),
        *_stamps(),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_room_links_organization_id_organizations"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "room_id"],
            ["compliance_rooms.organization_id", "compliance_rooms.id"],
            name="fk_room_links_room",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id", "created_by_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_room_links_created_by_membership",
            ondelete="SET NULL (created_by_membership_id)",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_room_links")),
        sa.UniqueConstraint("token_hash", name=op.f("uq_room_links_token_hash")),
    )
    op.create_index("ix_room_links_org_room", "room_links", ["organization_id", "room_id"])
    op.add_column(
        "documents",
        sa.Column("shared_in_room", sa.Boolean(), server_default="false", nullable=False),
    )
    op.add_column(
        "controls",
        sa.Column("shared_in_room", sa.Boolean(), server_default="false", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("controls", "shared_in_room")
    op.drop_column("documents", "shared_in_room")
    op.drop_index("ix_room_links_org_room", table_name="room_links")
    op.drop_table("room_links")
    op.drop_table("compliance_rooms")
