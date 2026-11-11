"""Track media awaiting Cloudinary cleanup.

Revision ID: 20261110_0002
Revises: 20261110_0001
Create Date: 2026-11-10
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20261110_0002"
down_revision: Union[str, None] = "20261110_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "media",
        sa.Column(
            "deletion_pending",
            sa.Boolean(),
            server_default=sa.false(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("media", "deletion_pending")
