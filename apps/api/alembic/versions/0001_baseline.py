"""baseline

Empty root revision. Every later migration descends from it, which keeps history
linear and makes `alembic downgrade base` well-defined.

Revision ID: 0001
Revises:
Create Date: 2026-09-12

"""

from collections.abc import Sequence

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
