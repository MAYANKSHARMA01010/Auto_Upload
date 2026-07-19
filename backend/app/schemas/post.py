"""
ScheduledPost Pydantic schemas — create, update, and response models.
"""
from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, Field

from app.models.scheduled_post import Platform, PostStatus


# ──────────────────────────────────────────────
# Create schema (used when creating/scheduling a post)
# ──────────────────────────────────────────────
class ScheduledPostCreate(BaseModel):
    video_id: uuid.UUID
    platform: Platform
    connected_account_id: Optional[uuid.UUID] = None
    status: PostStatus = PostStatus.DRAFT

    # Schedule
    schedule_datetime: Optional[datetime] = None
    timezone: str = "UTC"

    # YouTube
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    tags: Optional[str] = None
    keywords: Optional[str] = None
    hashtags: Optional[str] = None
    playlist: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    visibility: Optional[str] = None
    license: Optional[str] = None
    allow_comments: Optional[bool] = None
    allow_ratings: Optional[bool] = None
    allow_embedding: Optional[bool] = None
    notify_subscribers: Optional[bool] = None
    made_for_kids: Optional[bool] = None

    # Instagram / Threads
    caption: Optional[str] = None
    location: Optional[str] = None
    collaborator: Optional[str] = None
    alt_text: Optional[str] = None

    # Facebook
    audience: Optional[str] = None

    # TikTok
    privacy: Optional[str] = None
    allow_stitch: Optional[bool] = None
    allow_duet: Optional[bool] = None
    allow_downloads: Optional[bool] = None
    brand_content: Optional[bool] = None
    paid_partnership: Optional[bool] = None

    # X
    post_text: Optional[str] = None
    reply_setting: Optional[str] = None
    sensitive_media: Optional[bool] = None


class ScheduledPostUpdate(ScheduledPostCreate):
    """All fields optional for PATCH-style updates."""
    video_id: Optional[uuid.UUID] = None
    platform: Optional[Platform] = None


class ScheduledPostResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    video_id: uuid.UUID
    platform: Platform
    connected_account_id: Optional[uuid.UUID] = None
    status: PostStatus
    schedule_datetime: Optional[datetime] = None
    timezone: str

    # Metadata
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    keywords: Optional[str] = None
    hashtags: Optional[str] = None
    playlist: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    visibility: Optional[str] = None
    license: Optional[str] = None
    allow_comments: Optional[bool] = None
    allow_ratings: Optional[bool] = None
    allow_embedding: Optional[bool] = None
    notify_subscribers: Optional[bool] = None
    made_for_kids: Optional[bool] = None
    caption: Optional[str] = None
    location: Optional[str] = None
    collaborator: Optional[str] = None
    alt_text: Optional[str] = None
    audience: Optional[str] = None
    privacy: Optional[str] = None
    allow_stitch: Optional[bool] = None
    allow_duet: Optional[bool] = None
    allow_downloads: Optional[bool] = None
    brand_content: Optional[bool] = None
    paid_partnership: Optional[bool] = None
    post_text: Optional[str] = None
    reply_setting: Optional[str] = None
    sensitive_media: Optional[bool] = None

    # Publishing
    platform_post_id: Optional[str] = None
    published_at: Optional[datetime] = None
    error_message: Optional[str] = None
    retry_count: int = 0

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BulkScheduleRequest(BaseModel):
    """Create multiple platform posts in one request."""
    video_id: uuid.UUID
    schedule_datetime: Optional[datetime] = None
    timezone: str = "UTC"
    posts: list[ScheduledPostCreate]
