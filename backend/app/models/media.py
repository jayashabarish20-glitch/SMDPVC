from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKey


class CloudinaryCleanup(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "cloudinary_cleanup"

    public_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)


class Media(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "media"
    __table_args__ = (
        CheckConstraint("file_size > 0", name="positive_file_size"),
        CheckConstraint("width IS NULL OR width > 0", name="positive_width"),
        CheckConstraint("height IS NULL OR height > 0", name="positive_height"),
        Index("ix_media_created_at", "created_at"),
    )

    cloudinary_public_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
    )
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_format: Mapped[str] = mapped_column(String(16), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    alt_text: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    deletion_pending: Mapped[bool] = mapped_column(
        nullable=False,
        default=False,
        server_default="false",
    )

    gallery_images: Mapped[list["GalleryImage"]] = relationship(
        back_populates="media",
    )
    photo_configurations: Mapped[list["PhotoConfiguration"]] = relationship(
        back_populates="media",
    )
    leadership_profiles: Mapped[list["LeadershipProfile"]] = relationship(
        back_populates="media",
    )
    school_sections: Mapped[list["SchoolSection"]] = relationship(
        back_populates="card_media",
    )
    toppers: Mapped[list["Topper"]] = relationship(back_populates="media")
    content_items: Mapped[list["ContentItem"]] = relationship(
        back_populates="media",
    )


class PhotoConfiguration(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "photo_configurations"
    __table_args__ = (
        UniqueConstraint("config_key", "display_order"),
        CheckConstraint("display_order >= 0", name="nonnegative_display_order"),
        Index("ix_photo_configurations_config_key", "config_key"),
    )

    config_key: Mapped[str] = mapped_column(String(160), nullable=False)
    media_id: Mapped[UUID] = mapped_column(
        ForeignKey("media.id", ondelete="RESTRICT"),
        nullable=False,
    )
    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    media: Mapped[Media] = relationship(back_populates="photo_configurations")
