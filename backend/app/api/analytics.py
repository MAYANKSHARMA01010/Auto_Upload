"""
Analytics API — dashboard stats, platform breakdown, timeline.
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.scheduled_post import Platform, PostStatus, ScheduledPost
from app.models.user import User
from app.models.video import Video
from app.schemas.analytics import OverallStats, PlatformStats, TimelinePoint

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=OverallStats)
async def get_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return overall stats and platform breakdown for the dashboard."""
    uid = current_user.id
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    async def count(status=None, platform=None):
        q = select(func.count()).where(ScheduledPost.user_id == uid)
        if status:
            q = q.where(ScheduledPost.status == status)
        if platform:
            q = q.where(ScheduledPost.platform == platform)
        return (await db.execute(q)).scalar_one()

    total_videos = (await db.execute(
        select(func.count()).where(Video.user_id == uid)
    )).scalar_one()

    total_posts = await count()
    published = await count(status=PostStatus.PUBLISHED)
    scheduled = await count(status=PostStatus.SCHEDULED)
    failed = await count(status=PostStatus.FAILED)
    drafts = await count(status=PostStatus.DRAFT)

    # Upcoming today
    upcoming_today_result = await db.execute(
        select(func.count()).where(
            and_(
                ScheduledPost.user_id == uid,
                ScheduledPost.status == PostStatus.SCHEDULED,
                ScheduledPost.schedule_datetime >= today_start,
                ScheduledPost.schedule_datetime < today_end,
            )
        )
    )
    upcoming_today = upcoming_today_result.scalar_one()

    # Platform breakdown
    platform_stats = []
    for platform in Platform:
        platform_stats.append(
            PlatformStats(
                platform=platform.value,
                published=await count(status=PostStatus.PUBLISHED, platform=platform),
                scheduled=await count(status=PostStatus.SCHEDULED, platform=platform),
                failed=await count(status=PostStatus.FAILED, platform=platform),
                drafts=await count(status=PostStatus.DRAFT, platform=platform),
            )
        )

    return OverallStats(
        total_videos=total_videos,
        total_posts=total_posts,
        published=published,
        scheduled=scheduled,
        failed=failed,
        drafts=drafts,
        upcoming_today=upcoming_today,
        platform_breakdown=platform_stats,
    )


@router.get("/timeline", response_model=list[TimelinePoint])
async def get_timeline(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return daily post counts for the last N days."""
    start = datetime.now(timezone.utc) - timedelta(days=days)
    timeline = []

    for i in range(days):
        day = start + timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        async def day_count(s):
            q = select(func.count()).where(
                and_(
                    ScheduledPost.user_id == current_user.id,
                    ScheduledPost.status == s,
                    ScheduledPost.updated_at >= day_start,
                    ScheduledPost.updated_at < day_end,
                )
            )
            return (await db.execute(q)).scalar_one()

        timeline.append(
            TimelinePoint(
                date=day_start.strftime("%Y-%m-%d"),
                published=await day_count(PostStatus.PUBLISHED),
                failed=await day_count(PostStatus.FAILED),
                scheduled=await day_count(PostStatus.SCHEDULED),
            )
        )

    return timeline
