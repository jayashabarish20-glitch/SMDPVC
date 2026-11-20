"""Add centum_subjects JSON field to toppers table.

Revision ID: 20261118_0007
Revises: 20261117_0006
Create Date: 2026-11-18
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20261118_0007"
down_revision: Union[str, None] = "20261117_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("toppers", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("centum_subjects", sa.JSON(), nullable=False, server_default="[]"),
        )


def downgrade() -> None:
    with op.batch_alter_table("toppers", schema=None) as batch_op:
        batch_op.drop_column("centum_subjects")
