"""Create the initial SMDPVC content and administration schema.

Revision ID: 20261110_0001
Revises:
Create Date: 2026-11-10
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20261110_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "achievements",
        sa.Column("category", sa.String(length=20), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("sport", sa.String(length=120), nullable=True),
        sa.Column("level", sa.String(length=80), nullable=True),
        sa.Column("academic_year", sa.String(length=20), nullable=True),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_published", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "category IN ('academic', 'sports')",
            name=op.f("ck_achievements_valid_category"),
        ),
        sa.CheckConstraint(
            "display_order >= 0",
            name=op.f("ck_achievements_nonnegative_display_order"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_achievements")),
    )
    op.create_index(
        "ix_achievements_published_order",
        "achievements",
        ["is_published", "display_order"],
    )

    op.create_table(
        "admin_users",
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_admin_users")),
        sa.UniqueConstraint("email", name=op.f("uq_admin_users_email")),
    )
    op.create_index("ix_admin_users_is_active", "admin_users", ["is_active"])

    op.create_table(
        "announcements",
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("is_published", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_announcements")),
    )
    op.create_index(
        "ix_announcements_published_at",
        "announcements",
        ["is_published", "published_at"],
    )

    op.create_table(
        "gallery_collections",
        sa.Column("collection_key", sa.String(length=120), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("page_slug", sa.String(length=80), nullable=True),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_published", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_gallery_collections")),
        sa.UniqueConstraint("collection_key", name=op.f("uq_gallery_collections_collection_key")),
    )

    op.create_table(
        "media",
        sa.Column("cloudinary_public_id", sa.String(length=255), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("file_format", sa.String(length=16), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column("alt_text", sa.String(length=500), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("file_size > 0", name=op.f("ck_media_positive_file_size")),
        sa.CheckConstraint(
            "height IS NULL OR height > 0",
            name=op.f("ck_media_positive_height"),
        ),
        sa.CheckConstraint(
            "width IS NULL OR width > 0",
            name=op.f("ck_media_positive_width"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_media")),
        sa.UniqueConstraint(
            "cloudinary_public_id",
            name=op.f("uq_media_cloudinary_public_id"),
        ),
    )
    op.create_index("ix_media_created_at", "media", ["created_at"])

    op.create_table(
        "permissions",
        sa.Column("code", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_permissions")),
        sa.UniqueConstraint("code", name=op.f("uq_permissions_code")),
    )

    op.create_table(
        "roles",
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_roles")),
        sa.UniqueConstraint("name", name=op.f("uq_roles_name")),
    )

    op.create_table(
        "website_settings",
        sa.Column("key", sa.String(length=160), nullable=False),
        sa.Column("value", sa.JSON(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("is_public", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_website_settings")),
        sa.UniqueConstraint("key", name=op.f("uq_website_settings_key")),
    )

    op.create_table(
        "admin_user_roles",
        sa.Column("admin_user_id", sa.Uuid(), nullable=False),
        sa.Column("role_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["admin_user_id"],
            ["admin_users.id"],
            name=op.f("fk_admin_user_roles_admin_user_id_admin_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["role_id"],
            ["roles.id"],
            name=op.f("fk_admin_user_roles_role_id_roles"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "admin_user_id",
            "role_id",
            name=op.f("pk_admin_user_roles"),
        ),
    )

    op.create_table(
        "gallery_images",
        sa.Column("collection_id", sa.Uuid(), nullable=False),
        sa.Column("media_id", sa.Uuid(), nullable=False),
        sa.Column("alt_text", sa.String(length=500), nullable=True),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "display_order >= 0",
            name=op.f("ck_gallery_images_nonnegative_display_order"),
        ),
        sa.ForeignKeyConstraint(
            ["collection_id"],
            ["gallery_collections.id"],
            name=op.f("fk_gallery_images_collection_id_gallery_collections"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["media_id"],
            ["media.id"],
            name=op.f("fk_gallery_images_media_id_media"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_gallery_images")),
        sa.UniqueConstraint(
            "collection_id",
            "display_order",
            name=op.f("uq_gallery_images_collection_id"),
        ),
    )
    op.create_index("ix_gallery_images_media_id", "gallery_images", ["media_id"])

    op.create_table(
        "leadership_profiles",
        sa.Column("profile_key", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("designation", sa.String(length=160), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("short_bio", sa.Text(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("media_id", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "display_order >= 0",
            name=op.f("ck_leadership_profiles_nonnegative_display_order"),
        ),
        sa.ForeignKeyConstraint(
            ["media_id"],
            ["media.id"],
            name=op.f("fk_leadership_profiles_media_id_media"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_leadership_profiles")),
        sa.UniqueConstraint(
            "profile_key",
            name=op.f("uq_leadership_profiles_profile_key"),
        ),
    )
    op.create_index(
        "ix_leadership_profiles_active_order",
        "leadership_profiles",
        ["is_active", "display_order"],
    )

    op.create_table(
        "photo_configurations",
        sa.Column("config_key", sa.String(length=160), nullable=False),
        sa.Column("media_id", sa.Uuid(), nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "display_order >= 0",
            name=op.f("ck_photo_configurations_nonnegative_display_order"),
        ),
        sa.ForeignKeyConstraint(
            ["media_id"],
            ["media.id"],
            name=op.f("fk_photo_configurations_media_id_media"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_photo_configurations")),
        sa.UniqueConstraint(
            "config_key",
            "display_order",
            name=op.f("uq_photo_configurations_config_key"),
        ),
    )
    op.create_index(
        "ix_photo_configurations_config_key",
        "photo_configurations",
        ["config_key"],
    )

    op.create_table(
        "role_permissions",
        sa.Column("role_id", sa.Uuid(), nullable=False),
        sa.Column("permission_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["permission_id"],
            ["permissions.id"],
            name=op.f("fk_role_permissions_permission_id_permissions"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["role_id"],
            ["roles.id"],
            name=op.f("fk_role_permissions_role_id_roles"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "role_id",
            "permission_id",
            name=op.f("pk_role_permissions"),
        ),
    )

    op.create_table(
        "school_sections",
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("href", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("image_alt", sa.String(length=500), nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("card_media_id", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "display_order >= 0",
            name=op.f("ck_school_sections_nonnegative_display_order"),
        ),
        sa.ForeignKeyConstraint(
            ["card_media_id"],
            ["media.id"],
            name=op.f("fk_school_sections_card_media_id_media"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_school_sections")),
        sa.UniqueConstraint("href", name=op.f("uq_school_sections_href")),
        sa.UniqueConstraint("slug", name=op.f("uq_school_sections_slug")),
    )
    op.create_index(
        "ix_school_sections_active_order",
        "school_sections",
        ["is_active", "display_order"],
    )

    op.create_table(
        "toppers",
        sa.Column("student_name", sa.String(length=160), nullable=False),
        sa.Column("grade_level", sa.String(length=32), nullable=False),
        sa.Column("academic_year", sa.String(length=20), nullable=True),
        sa.Column("score", sa.String(length=40), nullable=False),
        sa.Column("stream", sa.String(length=120), nullable=False),
        sa.Column("subject", sa.String(length=120), nullable=True),
        sa.Column("rank", sa.Integer(), nullable=True),
        sa.Column("achievement", sa.Text(), nullable=True),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_published", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("media_id", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "display_order >= 0",
            name=op.f("ck_toppers_nonnegative_display_order"),
        ),
        sa.CheckConstraint(
            "rank IS NULL OR rank > 0",
            name=op.f("ck_toppers_positive_rank"),
        ),
        sa.ForeignKeyConstraint(
            ["media_id"],
            ["media.id"],
            name=op.f("fk_toppers_media_id_media"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_toppers")),
    )
    op.create_index(
        "ix_toppers_published_grade_order",
        "toppers",
        ["is_published", "grade_level", "display_order"],
    )


def downgrade() -> None:
    op.drop_index("ix_toppers_published_grade_order", table_name="toppers")
    op.drop_table("toppers")
    op.drop_index("ix_school_sections_active_order", table_name="school_sections")
    op.drop_table("school_sections")
    op.drop_table("role_permissions")
    op.drop_index(
        "ix_photo_configurations_config_key",
        table_name="photo_configurations",
    )
    op.drop_table("photo_configurations")
    op.drop_index(
        "ix_leadership_profiles_active_order",
        table_name="leadership_profiles",
    )
    op.drop_table("leadership_profiles")
    op.drop_index("ix_gallery_images_media_id", table_name="gallery_images")
    op.drop_table("gallery_images")
    op.drop_table("admin_user_roles")
    op.drop_table("website_settings")
    op.drop_table("roles")
    op.drop_table("permissions")
    op.drop_index("ix_media_created_at", table_name="media")
    op.drop_table("media")
    op.drop_table("gallery_collections")
    op.drop_index("ix_announcements_published_at", table_name="announcements")
    op.drop_table("announcements")
    op.drop_index("ix_admin_users_is_active", table_name="admin_users")
    op.drop_table("admin_users")
    op.drop_index("ix_achievements_published_order", table_name="achievements")
    op.drop_table("achievements")
