"""
Analytics API — dashboard stats, platform breakdown, timeline, and dynamic social insights.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache_service
from app.core.dependencies import get_current_user, get_db
from app.models.connected_account import ConnectedAccount
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
    """Return overall stats and platform breakdown for the dashboard (cached)."""
    cache_key = f"user_analytics_overview:{current_user.id}"
    cached = await cache_service.get(cache_key)
    if cached is not None:
        return OverallStats.model_validate(cached)

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

    res = OverallStats(
        total_videos=total_videos,
        total_posts=total_posts,
        published=published,
        scheduled=scheduled,
        failed=failed,
        drafts=drafts,
        upcoming_today=upcoming_today,
        platform_breakdown=platform_stats,
    )
    await cache_service.set(cache_key, res.model_dump(mode="json"), ttl_seconds=300)
    return res


@router.get("/timeline", response_model=list[TimelinePoint])
async def get_timeline(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return daily post counts for the last N days (cached)."""
    cache_key = f"user_analytics_timeline:{current_user.id}:{days}"
    cached = await cache_service.get(cache_key)
    if cached is not None:
        return [TimelinePoint.model_validate(p) for p in cached]

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

    res_data = [t.model_dump(mode="json") for t in timeline]
    await cache_service.set(cache_key, res_data, ttl_seconds=300)
    return timeline


@router.get("/social-insights")
async def get_social_insights(
    platform: str = Query("youtube"),
    account_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return dynamic per-account analytics and video metrics directly from connected accounts and database posts.
    No hardcoded mock data.
    """
    p_lower = platform.lower()

    # 1. Query connected accounts for this platform
    acc_query = select(ConnectedAccount).where(
        and_(
            ConnectedAccount.user_id == current_user.id,
            ConnectedAccount.is_active == True,
        )
    )
    acc_result = await db.execute(acc_query)
    all_accounts = acc_result.scalars().all()

    # Filter connected accounts matching target platform
    platform_accounts = [
        {
            "id": str(acc.id),
            "platform": acc.platform.value if hasattr(acc.platform, "value") else str(acc.platform),
            "username": acc.username or acc.platform_user_id or "Connected Account",
            "platform_user_id": acc.platform_user_id,
            "created_at": acc.created_at.isoformat() if acc.created_at else None,
        }
        for acc in all_accounts
        if (acc.platform.value if hasattr(acc.platform, "value") else str(acc.platform)).lower() == p_lower
    ]

    # Select target account
    selected_account = None
    if account_id:
        selected_account = next((a for a in platform_accounts if a["id"] == account_id), None)
    if not selected_account and platform_accounts:
        selected_account = platform_accounts[0]

    # 2. Query posts for this specific platform and user
    posts_query = (
        select(ScheduledPost, Video)
        .join(Video, ScheduledPost.video_id == Video.id)
        .where(
            and_(
                ScheduledPost.user_id == current_user.id,
            )
        )
    )

    if p_lower:
        posts_query = posts_query.where(ScheduledPost.platform == p_lower)

    if selected_account:
        posts_query = posts_query.where(ScheduledPost.connected_account_id == selected_account["id"])

    posts_query = posts_query.order_by(ScheduledPost.created_at.desc())
    posts_result = await db.execute(posts_query)
    rows = posts_result.all()

    # 3. Calculate dynamic statistics from database rows
    total_posts = len(rows)
    published_count = sum(1 for post, _ in rows if post.status == PostStatus.PUBLISHED)
    scheduled_count = sum(1 for post, _ in rows if post.status == PostStatus.SCHEDULED)
    failed_count = sum(1 for post, _ in rows if post.status == PostStatus.FAILED)
    draft_count = sum(1 for post, _ in rows if post.status == PostStatus.DRAFT)

    video_items = []
    for post, video in rows:
        video_items.append({
            "id": str(post.id),
            "video_id": str(video.id),
            "title": post.title or post.caption or post.post_text or video.title or "Untitled Short",
            "status": post.status.value if hasattr(post.status, "value") else str(post.status),
            "scheduled_at": post.schedule_datetime.isoformat() if post.schedule_datetime else None,
            "published_at": post.published_at.isoformat() if post.published_at else None,
            "platform_post_id": post.platform_post_id,
            "error_message": post.error_message,
        })

    return {
        "platform": p_lower,
        "connected_accounts": platform_accounts,
        "selected_account": selected_account,
        "stats": {
            "total_posts": total_posts,
            "published": published_count,
            "scheduled": scheduled_count,
            "failed": failed_count,
            "drafts": draft_count,
        },
        "videos": video_items,
    }
