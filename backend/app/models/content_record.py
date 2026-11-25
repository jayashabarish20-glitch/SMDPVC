from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKey


class ContentRecord(UUIDPrimaryKey, TimestampMixin, Base):
    """Generic text content for one website feature, keyed by record_key.

    payload holds the feature's JSON text fields (titles, descriptions,
    names, subject lists, and so on). Media references live in
    ContentRecordMedia so deletes of in-use media can be blocked.
    """

    __tablename__ = "content_records"
    __table_args__ = (Index("ix_content_records_record_key", "record_key", unique=True),)

    record_key: Mapped[str] = mapped_column(String(160), nullable=False)
    payload: Mapped[str] = mapped_column(Text, nullable=False, default="{}")

    media_links: Mapped[list["ContentRecordMedia"]] = relationship(
        back_populates="record",
        cascade="all, delete-orphan",
        order_by="ContentRecordMedia.position",
    )


class ContentRecordMedia(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "content_record_media"
    __table_args__ = (
        Index("uq_content_record_media_link", "record_id", "media_id", "role", unique=True),
        CheckConstraint("position >= 0", name="nonnegative_record_media_position"),
    )

    record_id: Mapped[UUID] = mapped_column(
        ForeignKey("content_records.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    media_id: Mapped[UUID] = mapped_column(
        ForeignKey("media.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    role: Mapped[str] = mapped_column(String(80), nullable=False, default="")
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    record: Mapped[ContentRecord] = relationship(back_populates="media_links")
    media: Mapped["Media"] = relationship()
