"""
ScheduledPost model — one row per platform per upload.
Contains all possible metadata fields across all 6 platforms.
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class PostStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    UPLOADING = "uploading"
    PUBLISHED = "published"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Platform(str, enum.Enum):
    YOUTUBE = "youtube"
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"
    TIKTOK = "tiktok"
    THREADS = "threads"
    X = "x"


class ScheduledPost(Base, TimestampMixin):
    __tablename__ = "scheduled_posts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    video_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Platform
    platform: Mapped[Platform] = mapped_column(
        Enum(Platform, name="platform_enum"), nullable=False, index=True
    )

    # Status
    status: Mapped[PostStatus] = mapped_column(
        Enum(PostStatus, name="post_status_enum"),
        default=PostStatus.DRAFT,
        nullable=False,
        index=True,
    )

    # --- Schedule ---
    schedule_datetime: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    timezone: Mapped[str] = mapped_column(String(100), default="UTC", nullable=False)

    # --- YouTube Shorts fields ---
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)          # comma-separated
    keywords: Mapped[str | None] = mapped_column(Text, nullable=True)
    hashtags: Mapped[str | None] = mapped_column(Text, nullable=True)
    playlist: Mapped[str | None] = mapped_column(String(255), nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    language: Mapped[str | None] = mapped_column(String(50), nullable=True)
    visibility: Mapped[str | None] = mapped_column(String(50), nullable=True)  # public/private/unlisted/scheduled
    license: Mapped[str | None] = mapped_column(String(100), nullable=True)
    allow_comments: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    allow_ratings: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    allow_embedding: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    notify_subscribers: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    made_for_kids: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # --- Instagram Reels / Threads fields ---
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    collaborator: Mapped[str | None] = mapped_column(String(255), nullable=True)
    alt_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Facebook Reels fields ---
    audience: Mapped[str | None] = mapped_column(String(50), nullable=True)  # public/friends/only_me

    # --- TikTok fields ---
    privacy: Mapped[str | None] = mapped_column(String(50), nullable=True)  # public/friends/private
    allow_stitch: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    allow_duet: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    allow_downloads: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    brand_content: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    paid_partnership: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # --- X (Twitter) fields ---
    post_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    reply_setting: Mapped[str | None] = mapped_column(String(50), nullable=True)
    sensitive_media: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # --- Publishing metadata ---
    platform_post_id: Mapped[str | None] = mapped_column(String(500), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(default=0, nullable=False)

    # Relationships
    user = relationship("User", back_populates="scheduled_posts")
    video = relationship("Video", back_populates="scheduled_posts")

    def __repr__(self) -> str:
        return f"<ScheduledPost id={self.id} platform={self.platform} status={self.status}>"
