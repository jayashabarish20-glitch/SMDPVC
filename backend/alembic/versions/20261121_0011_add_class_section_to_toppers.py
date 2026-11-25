"""Add class and section fields to toppers for subject-wise records.

Revision ID: 20261121_0011
Revises: 20261121_0010
Create Date: 2026-11-21 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20261121_0011"
down_revision = "20261121_0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add class_name and section columns to toppers table
    op.add_column(
        "toppers",
        sa.Column("class_name", sa.String(length=50), nullable=True, server_default=""),
    )
    op.add_column(
        "toppers",
        sa.Column("section", sa.String(length=10), nullable=True, server_default=""),
    )


def downgrade() -> None:
    # Remove class_name and section columns
    op.drop_column("toppers", "section")
    op.drop_column("toppers", "class_name")
