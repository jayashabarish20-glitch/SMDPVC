"""Add alumni table for Higher Secondary section.

Revision ID: 20261118_0008
Revises: 20261118_0007
Create Date: 2026-11-18
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261118_0008"
down_revision: Union[str, None] = "20261118_0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "alumni",
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("batch_year", sa.String(length=20), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("media_id", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["media_id"],
            ["media.id"],
            name=op.f("fk_alumni_media_id_media"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_alumni")),
        sa.CheckConstraint("display_order >= 0", name="nonnegative_alumni_display_order"),
    )
    op.create_index(
        "ix_alumni_published_order",
        "alumni",
        ["is_published", "display_order"],
    )


def downgrade() -> None:
    op.drop_table("alumni")
