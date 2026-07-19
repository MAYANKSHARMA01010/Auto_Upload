"""
Analytics Pydantic schemas.
"""
from pydantic import BaseModel
from app.models.scheduled_post import Platform


class PlatformStats(BaseModel):
    platform: str
    published: int
    scheduled: int
    failed: int
    drafts: int


class OverallStats(BaseModel):
    total_videos: int
    total_posts: int
    published: int
    scheduled: int
    failed: int
    drafts: int
    upcoming_today: int
    platform_breakdown: list[PlatformStats]


class TimelinePoint(BaseModel):
    date: str
    published: int
    failed: int
    scheduled: int
