from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKey


class LeadershipProfile(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "leadership_profiles"
    __table_args__ = (
        Index(
            "ix_leadership_profiles_active_order",
            "is_active",
            "display_order",
        ),
        CheckConstraint("display_order >= 0", name="nonnegative_display_order"),
    )

    profile_key: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    designation: Mapped[str] = mapped_column(String(160), nullable=False, default="")
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    short_bio: Mapped[str] = mapped_column(Text, nullable=False, default="")
    message: Mapped[str] = mapped_column(Text, nullable=False, default="")
    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )
    media_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("media.id", ondelete="SET NULL"),
    )
    media: Mapped["Media | None"] = relationship(
        back_populates="leadership_profiles",
    )


class SchoolSection(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "school_sections"
    __table_args__ = (
        CheckConstraint("display_order >= 0", name="nonnegative_display_order"),
        Index("ix_school_sections_active_order", "is_active", "display_order"),
    )

    slug: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    href: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    image_alt: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )
    card_media_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("media.id", ondelete="SET NULL"),
    )
    card_media: Mapped["Media | None"] = relationship(back_populates="school_sections")


class GalleryCollection(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "gallery_collections"

    collection_key: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
        unique=True,
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    page_slug: Mapped[str | None] = mapped_column(String(80))
    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    is_published: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    images: Mapped[list["GalleryImage"]] = relationship(
        back_populates="collection",
        cascade="all, delete-orphan",
        order_by="GalleryImage.display_order",
    )


class GalleryImage(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "gallery_images"
    __table_args__ = (
        UniqueConstraint("collection_id", "display_order"),
        CheckConstraint("display_order >= 0", name="nonnegative_display_order"),
        Index("ix_gallery_images_media_id", "media_id"),
    )

    collection_id: Mapped[UUID] = mapped_column(
        ForeignKey("gallery_collections.id", ondelete="CASCADE"),
        nullable=False,
    )
    media_id: Mapped[UUID] = mapped_column(
        ForeignKey("media.id", ondelete="RESTRICT"),
        nullable=False,
    )
    alt_text: Mapped[str | None] = mapped_column(String(500))
    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    collection: Mapped[GalleryCollection] = relationship(back_populates="images")
    media: Mapped["Media"] = relationship(back_populates="gallery_images")


class Achievement(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "achievements"
    __table_args__ = (
        CheckConstraint(
            "category IN ('academic', 'sports')",
            name="valid_category",
        ),
        CheckConstraint("display_order >= 0", name="nonnegative_display_order"),
        Index(
            "ix_achievements_published_order",
            "is_published",
            "display_order",
        ),
    )

    category: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    sport: Mapped[str | None] = mapped_column(String(120))
    level: Mapped[str | None] = mapped_column(String(80))
    academic_year: Mapped[str | None] = mapped_column(String(20))
    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    is_published: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )


class Topper(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "toppers"
    __table_args__ = (
        CheckConstraint("rank IS NULL OR rank > 0", name="positive_rank"),
        CheckConstraint("display_order >= 0", name="nonnegative_display_order"),
        Index(
            "ix_toppers_published_grade_order",
            "is_published",
            "grade_level",
            "display_order",
        ),
    )

    student_name: Mapped[str] = mapped_column(String(160), nullable=False)
    grade_level: Mapped[str] = mapped_column(String(32), nullable=False)
    academic_year: Mapped[str | None] = mapped_column(String(20))
    score: Mapped[str] = mapped_column(String(40), nullable=False, default="")
    stream: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    subject: Mapped[str | None] = mapped_column(String(120))
    rank: Mapped[int | None] = mapped_column(Integer)
    achievement: Mapped[str | None] = mapped_column(Text)
    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    is_published: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    media_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("media.id", ondelete="SET NULL"),
    )
    media: Mapped["Media | None"] = relationship(back_populates="toppers")


class Announcement(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "announcements"
    __table_args__ = (
        Index(
            "ix_announcements_published_at",
            "is_published",
            "published_at",
        ),
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_published: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class WebsiteSetting(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "website_settings"

    key: Mapped[str] = mapped_column(String(160), nullable=False, unique=True)
    value: Mapped[Any] = mapped_column(JSON, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    is_public: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )
