"""Add generic content records and PDF/video media types.

Adds content_records and content_record_media tables for backend-stored
website text, and a resource_type column on media and cloudinary_cleanup so
PDFs (raw) and videos can be stored and removed correctly. Existing rows get
resource_type='image', so no existing record changes meaning.

Revision ID: 20261119_0009
Revises: 20261118_0008
Create Date: 2026-11-19
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261119_0009"
down_revision: Union[str, None] = "20261118_0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "content_records",
        sa.Column("record_key", sa.String(length=160), nullable=False),
        sa.Column("payload", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_content_records_record_key", "content_records", ["record_key"], unique=True)
    op.create_table(
        "content_record_media",
        sa.Column("record_id", sa.Uuid(), nullable=False),
        sa.Column("media_id", sa.Uuid(), nullable=False),
        sa.Column("role", sa.String(length=80), nullable=False, server_default=""),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("position >= 0", name="nonnegative_record_media_position"),
        sa.ForeignKeyConstraint(["record_id"], ["content_records.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["media_id"], ["media.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("uq_content_record_media_link", "content_record_media", ["record_id", "media_id", "role"], unique=True)
    op.create_index(
        "ix_content_record_media_record_id", "content_record_media", ["record_id"]
    )
    op.create_index(
        "ix_content_record_media_media_id", "content_record_media", ["media_id"]
    )

    with op.batch_alter_table("media") as batch:
        batch.add_column(
            sa.Column(
                "resource_type",
                sa.String(length=16),
                nullable=False,
                server_default="image",
            )
        )
    with op.batch_alter_table("cloudinary_cleanup") as batch:
        batch.add_column(
            sa.Column(
                "resource_type",
                sa.String(length=16),
                nullable=False,
                server_default="image",
            )
        )


def downgrade() -> None:
    with op.batch_alter_table("cloudinary_cleanup") as batch:
        batch.drop_column("resource_type")
    with op.batch_alter_table("media") as batch:
        batch.drop_column("resource_type")
    op.drop_index("uq_content_record_media_link", table_name="content_record_media")
    op.drop_index("ix_content_record_media_media_id", table_name="content_record_media")
    op.drop_index("ix_content_record_media_record_id", table_name="content_record_media")
    op.drop_table("content_record_media")
    op.drop_index("ix_content_records_record_key", table_name="content_records")
    op.drop_table("content_records")
