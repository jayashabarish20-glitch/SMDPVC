from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import Field

from app.schemas.base import EntityRead, Schema
from app.schemas.media import MediaRead


class AboutSectionCreate(Schema):
    section_key: str = Field(min_length=1, max_length=80)
    description: str = ""
    media_id: UUID | None = None


class AboutSectionUpdate(Schema):
    description: str | None = None
    media_id: UUID | None = None


class AboutSectionRead(EntityRead):
    section_key: str
    description: str
    media_id: UUID | None
    media: MediaRead | None = None


class LeadershipProfileCreate(Schema):
    profile_key: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=160)
    designation: str = Field(default="", max_length=160)
    category: str = Field(min_length=1, max_length=100)
    short_bio: str = ""
    message: str = ""
    display_order: int = Field(default=0, ge=0)
    is_active: bool = True
    media_id: UUID | None = None


class LeadershipProfileUpdate(Schema):
    profile_key: str | None = Field(default=None, min_length=1, max_length=80)
    name: str | None = Field(default=None, min_length=1, max_length=160)
    designation: str | None = Field(default=None, max_length=160)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    short_bio: str | None = None
    message: str | None = None
    display_order: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
    media_id: UUID | None = None


class LeadershipProfileRead(EntityRead):
    profile_key: str
    name: str
    designation: str
    category: str
    short_bio: str
    message: str
    display_order: int
    is_active: bool
    media_id: UUID | None
    media: MediaRead | None = None


class LeadershipProfileCreateNew(Schema):
    """Create payload; the server generates profile_key."""

    name: str = Field(min_length=1, max_length=160)
    designation: str = Field(default="", max_length=160)
    category: str = Field(default="", max_length=100)
    short_bio: str = ""
    message: str = ""
    is_active: bool = True
    media_id: UUID | None = None


class ReorderRequest(Schema):
    ids: list[UUID] = Field(min_length=1, max_length=500)


class ContentItemCreate(Schema):
    page_slug: str = Field(min_length=1, max_length=80)
    section_key: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=5000)
    is_active: bool = True
    media_id: UUID | None = None


class ContentItemUpdate(Schema):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    is_active: bool | None = None
    media_id: UUID | None = None


class ContentItemReorder(Schema):
    page_slug: str = Field(min_length=1, max_length=80)
    section_key: str = Field(min_length=1, max_length=80)
    ids: list[UUID] = Field(min_length=1, max_length=500)


class ContentItemRead(EntityRead):
    page_slug: str
    section_key: str
    title: str
    description: str
    display_order: int
    is_active: bool
    media_id: UUID | None
    media: MediaRead | None = None


class SchoolSectionCreate(Schema):
    slug: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=160)
    description: str = ""
    href: str = Field(min_length=1, max_length=255)
    category: str = Field(default="", max_length=100)
    image_alt: str = Field(default="", max_length=500)
    display_order: int = Field(default=0, ge=0)
    is_active: bool = True
    card_media_id: UUID | None = None


class SchoolSectionUpdate(Schema):
    slug: str | None = Field(default=None, min_length=1, max_length=80)
    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = None
    href: str | None = Field(default=None, min_length=1, max_length=255)
    category: str | None = Field(default=None, max_length=100)
    image_alt: str | None = Field(default=None, max_length=500)
    display_order: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
    card_media_id: UUID | None = None


class SchoolSectionRead(EntityRead):
    slug: str
    title: str
    description: str
    href: str
    category: str
    image_alt: str
    display_order: int
    is_active: bool
    card_media_id: UUID | None
    card_media: MediaRead | None = None


class TopperUpdate(Schema):
    student_name: str | None = Field(default=None, min_length=1, max_length=160)
    grade_level: str | None = Field(default=None, min_length=1, max_length=32)
    academic_year: str | None = None
    score: str | None = Field(default=None, max_length=40)
    stream: str | None = None
    subject: str | None = None
    class_name: str | None = None
    section: str | None = None
    rank: int | None = Field(default=None, gt=0)
    achievement: str | None = None
    centums_scored: int | None = Field(default=None, ge=0)
    centum_subjects: list[str] | None = Field(default=None, max_length=20)
    display_order: int | None = Field(default=None, ge=0)
    is_published: bool | None = None
    media_id: UUID | None = None


class TopperReorder(Schema):
    grade_level: str = Field(min_length=1, max_length=32)
    ids: list[UUID] = Field(min_length=1, max_length=500)


class GalleryCollectionCreate(Schema):
    collection_key: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=160)
    description: str = ""
    page_slug: str | None = Field(default=None, max_length=80)
    display_order: int = Field(default=0, ge=0)
    is_published: bool = True


class GalleryCollectionUpdate(Schema):
    collection_key: str | None = Field(default=None, min_length=1, max_length=120)
    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = None
    page_slug: str | None = Field(default=None, max_length=80)
    display_order: int | None = Field(default=None, ge=0)
    is_published: bool | None = None


class GalleryImageCreate(Schema):
    media_id: UUID
    alt_text: str | None = Field(default=None, max_length=500)
    display_order: int = Field(default=0, ge=0)


class GalleryImageUpdate(Schema):
    media_id: UUID | None = None
    alt_text: str | None = Field(default=None, max_length=500)
    display_order: int | None = Field(default=None, ge=0)


class GalleryImageRead(EntityRead):
    collection_id: UUID
    media_id: UUID
    alt_text: str | None
    display_order: int
    media: MediaRead


class GalleryCollectionRead(EntityRead):
    collection_key: str
    title: str
    description: str
    page_slug: str | None
    display_order: int
    is_published: bool
    images: list[GalleryImageRead] = Field(default_factory=list)


class AchievementCreate(Schema):
    category: Literal["academic", "sports"]
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    sport: str | None = Field(default=None, max_length=120)
    level: str | None = Field(default=None, max_length=80)
    academic_year: str | None = Field(default=None, max_length=20)
    display_order: int = Field(default=0, ge=0)
    is_published: bool = False


class AchievementUpdate(Schema):
    category: Literal["academic", "sports"] | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    sport: str | None = Field(default=None, max_length=120)
    level: str | None = Field(default=None, max_length=80)
    academic_year: str | None = Field(default=None, max_length=20)
    display_order: int | None = Field(default=None, ge=0)
    is_published: bool | None = None


class AchievementRead(EntityRead):
    category: Literal["academic", "sports"]
    title: str
    description: str
    sport: str | None
    level: str | None
    academic_year: str | None
    display_order: int
    is_published: bool


class TopperCreate(Schema):
    student_name: str = Field(min_length=1, max_length=160)
    grade_level: str = Field(min_length=1, max_length=32)
    academic_year: str | None = Field(default=None, max_length=20)
    score: str = Field(default="", max_length=40)
    stream: str = Field(default="", max_length=120)
    subject: str | None = Field(default=None, max_length=120)
    class_name: str | None = Field(default="", max_length=50)
    section: str | None = Field(default="", max_length=10)
    rank: int | None = Field(default=None, gt=0)
    achievement: str | None = None
    centums_scored: int = Field(default=0, ge=0)
    centum_subjects: list[str] = Field(default_factory=list, max_length=20)
    display_order: int = Field(default=0, ge=0)
    is_published: bool = False
    media_id: UUID | None = None


class TopperRead(EntityRead):
    student_name: str
    grade_level: str
    academic_year: str | None
    score: str
    stream: str
    subject: str | None
    class_name: str | None
    section: str | None
    rank: int | None
    achievement: str | None
    centums_scored: int
    centum_subjects: list[str]
    display_order: int
    is_published: bool
    media_id: UUID | None
    media: MediaRead | None = None


class AnnouncementCreate(Schema):
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1)
    is_published: bool = False
    published_at: datetime | None = None


class AnnouncementUpdate(Schema):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    body: str | None = Field(default=None, min_length=1)
    is_published: bool | None = None
    published_at: datetime | None = None


class AnnouncementRead(EntityRead):
    title: str
    body: str
    is_published: bool
    published_at: datetime | None


class WebsiteSettingCreate(Schema):
    key: str = Field(min_length=1, max_length=160)
    value: Any
    description: str = ""
    is_public: bool = True


class WebsiteSettingUpdate(Schema):
    value: Any = None
    description: str | None = None
    is_public: bool | None = None


class WebsiteSettingRead(EntityRead):
    key: str
    value: Any
    description: str
    is_public: bool


class AlumniCreate(Schema):
    name: str = Field(min_length=1, max_length=200)
    batch_year: str = Field(min_length=1, max_length=20)
    description: str = ""
    display_order: int = Field(default=0, ge=0)
    is_published: bool = False
    media_id: UUID | None = None


class AlumniUpdate(Schema):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    batch_year: str | None = Field(default=None, min_length=1, max_length=20)
    description: str | None = None
    display_order: int | None = Field(default=None, ge=0)
    is_published: bool | None = None
    media_id: UUID | None = None


class AlumniRead(EntityRead):
    name: str
    batch_year: str
    description: str
    display_order: int
    is_published: bool
    media_id: UUID | None
    media: MediaRead | None = None


class SportCreate(Schema):
    name: str = Field(min_length=1, max_length=200)
    description: str = ""
    display_order: int = Field(default=0, ge=0)
    is_active: bool = True
    media_id: UUID | None = None


class SportUpdate(Schema):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    display_order: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
    media_id: UUID | None = None


class SportRead(EntityRead):
    name: str
    description: str
    display_order: int
    is_active: bool
    media_id: UUID | None
    media: MediaRead | None = None


class SportsAchievementPhotoCreate(Schema):
    description: str = ""
    display_order: int = Field(default=0, ge=0)
    is_active: bool = True
    media_id: UUID | None = None


class SportsAchievementPhotoUpdate(Schema):
    description: str | None = None
    display_order: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
    media_id: UUID | None = None


class SportsAchievementPhotoRead(EntityRead):
    description: str
    display_order: int
    is_active: bool
    media_id: UUID | None
    media: MediaRead | None = None


class AcademicInformationCreate(Schema):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    display_order: int = Field(default=0, ge=0)
    is_active: bool = True
    media_id: UUID | None = None


class AcademicInformationUpdate(Schema):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    display_order: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
    media_id: UUID | None = None


class AcademicInformationRead(EntityRead):
    title: str
    description: str
    display_order: int
    is_active: bool
    media_id: UUID | None
    media: MediaRead | None = None


class ClubCreate(Schema):
    name: str = Field(min_length=1, max_length=200)
    description: str = ""
    display_order: int = Field(default=0, ge=0)
    is_active: bool = True
    media_id: UUID | None = None


class ClubUpdate(Schema):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    display_order: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
    media_id: UUID | None = None


class ClubRead(EntityRead):
    name: str
    description: str
    display_order: int
    is_active: bool
    media_id: UUID | None
    media: MediaRead | None = None


__all__ = [
    "AcademicInformationCreate",
    "AcademicInformationRead",
    "AcademicInformationUpdate",
    "AlumniCreate",
    "AlumniRead",
    "AlumniUpdate",
    "AchievementCreate",
    "AchievementRead",
    "AchievementUpdate",
    "AnnouncementCreate",
    "AnnouncementRead",
    "AnnouncementUpdate",
    "ClubCreate",
    "ClubRead",
    "ClubUpdate",
    "ContentItemCreate",
    "ContentItemRead",
    "ContentItemReorder",
    "ContentItemUpdate",
    "GalleryCollectionCreate",
    "GalleryCollectionRead",
    "GalleryCollectionUpdate",
    "GalleryImageCreate",
    "GalleryImageRead",
    "GalleryImageUpdate",
    "LeadershipProfileCreate",
    "LeadershipProfileCreateNew",
    "ReorderRequest",
    "LeadershipProfileRead",
    "LeadershipProfileUpdate",
    "SchoolSectionCreate",
    "SchoolSectionRead",
    "SchoolSectionUpdate",
    "SportCreate",
    "SportRead",
    "SportUpdate",
    "SportsAchievementPhotoCreate",
    "SportsAchievementPhotoRead",
    "SportsAchievementPhotoUpdate",
    "TopperCreate",
    "TopperRead",
    "TopperUpdate",
    "WebsiteSettingCreate",
    "WebsiteSettingRead",
    "WebsiteSettingUpdate",
]
