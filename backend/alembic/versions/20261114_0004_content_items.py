"""Add admin-managed content items.

Revision ID: 20261114_0004
Revises: 20261110_0003
Create Date: 2026-11-14
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20261114_0004"
down_revision: Union[str, None] = "20261110_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "content_items",
        sa.Column("page_slug", sa.String(length=80), nullable=False),
        sa.Column("section_key", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("media_id", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "display_order >= 0",
            name=op.f("ck_content_items_nonnegative_display_order"),
        ),
        sa.ForeignKeyConstraint(
            ["media_id"],
            ["media.id"],
            name=op.f("fk_content_items_media_id_media"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_content_items")),
    )
    op.create_index(
        "ix_content_items_section_order",
        "content_items",
        ["page_slug", "section_key", "is_active", "display_order"],
    )


def downgrade() -> None:
    op.drop_index("ix_content_items_section_order", table_name="content_items")
    op.drop_table("content_items")
