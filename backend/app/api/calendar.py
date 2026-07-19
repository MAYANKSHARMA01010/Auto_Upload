"""
Calendar API — returns posts within a date range for calendar views.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.post import ScheduledPostResponse
from app.services.post_service import PostService

router = APIRouter(prefix="/calendar", tags=["Calendar"])


@router.get("", response_model=list[ScheduledPostResponse])
async def get_calendar_posts(
    start: datetime = Query(..., description="Start of date range (ISO 8601)"),
    end: datetime = Query(..., description="End of date range (ISO 8601)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return all scheduled posts (any status) within the given date range.
    Used to populate calendar month/week/day views.
    """
    posts = await PostService.get_calendar_posts(db, current_user.id, start, end)
    return [ScheduledPostResponse.model_validate(p) for p in posts]
