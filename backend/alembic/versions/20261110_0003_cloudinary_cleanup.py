"""Persist Cloudinary cleanup work after replacements.

Revision ID: 20261110_0003
Revises: 20261110_0002
Create Date: 2026-11-10
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20261110_0003"
down_revision: Union[str, None] = "20261110_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "cloudinary_cleanup",
        sa.Column("public_id", sa.String(length=255), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_cloudinary_cleanup")),
        sa.UniqueConstraint("public_id", name=op.f("uq_cloudinary_cleanup_public_id")),
    )


def downgrade() -> None:
    op.drop_table("cloudinary_cleanup")
