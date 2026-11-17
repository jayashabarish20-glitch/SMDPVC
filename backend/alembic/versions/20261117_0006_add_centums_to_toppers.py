"""Add centums_scored field to toppers table.

Revision ID: 20261117_0006
Revises: 20261114_0005
Create Date: 2026-11-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20261117_0006"
down_revision: Union[str, None] = "20261114_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("toppers", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("centums_scored", sa.Integer(), nullable=False, server_default="0"),
        )
        batch_op.create_check_constraint(
            "ck_toppers_nonnegative_centums",
            "centums_scored >= 0",
        )


def downgrade() -> None:
    with op.batch_alter_table("toppers", schema=None) as batch_op:
        batch_op.drop_constraint("ck_toppers_nonnegative_centums", type_="check")
        batch_op.drop_column("centums_scored")
