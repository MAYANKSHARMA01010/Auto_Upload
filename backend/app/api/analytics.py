"""
Analytics API — dashboard stats, platform breakdown, timeline, and dynamic social insights.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, or_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache_service
from app.core.dependencies import get_current_user, get_db, get_cache_db
from app.integrations.youtube import YouTubeService
from app.integrations.instagram import InstagramService
from app.integrations.facebook import FacebookService
from app.models.analytics_cache import AnalyticsCache
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
    """Return daily post publishing counts for chart over last N days."""
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days)

    query = (
        select(
            func.date(ScheduledPost.published_at).label("day"),
            ScheduledPost.platform,
            func.count().label("cnt"),
        )
        .where(
            and_(
                ScheduledPost.user_id == current_user.id,
                ScheduledPost.status == PostStatus.PUBLISHED,
                ScheduledPost.published_at >= start_date,
            )
        )
        .group_by(func.date(ScheduledPost.published_at), ScheduledPost.platform)
        .order_by("day")
    )

    res = await db.execute(query)
    rows = res.all()

    # Aggregate by day
    by_day: dict[str, dict[str, int]] = {}
    for r in rows:
        d_str = str(r.day)
        if d_str not in by_day:
            by_day[d_str] = {}
        p_name = r.platform.value if hasattr(r.platform, "value") else str(r.platform)
        by_day[d_str][p_name] = r.cnt

    timeline = []
    for i in range(days):
        day_dt = (start_date + timedelta(days=i)).date()
        d_str = str(day_dt)
        counts = by_day.get(d_str, {})
        timeline.append(
            TimelinePoint(
                date=d_str,
                published=sum(counts.values()),
                youtube=counts.get("youtube", 0),
                instagram=counts.get("instagram", 0),
                facebook=counts.get("facebook", 0),
                tiktok=counts.get("tiktok", 0),
                threads=counts.get("threads", 0),
                x=counts.get("x", 0),
            )
        )

    return timeline


@router.get("/social-insights")
async def get_social_insights(
    platform: str = Query("youtube"),
    account_id: Optional[str] = Query(None),
    refresh: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    cache_db: AsyncSession = Depends(get_cache_db),
):
    """
    Return per-account analytics (cached for 24h in PostgreSQL table analytics_cache).
    Shared seamlessly across Phone, Mac, and Laptop devices.
    Pass refresh=true to force a live API update.
    """
    p_lower = platform.lower()
    cache_key = f"social_insights:{current_user.id}:{p_lower}:{account_id or 'default'}"
    now_utc = datetime.now(timezone.utc)

    # 1. Check Dedicated Cache Database first (if not forcing refresh)
    if not refresh:
        cache_query = select(AnalyticsCache).where(
            and_(
                AnalyticsCache.user_id == current_user.id,
                AnalyticsCache.cache_key == cache_key,
                AnalyticsCache.expires_at > now_utc,
            )
        )
        cache_res = await cache_db.execute(cache_query)
        cached_record = cache_res.scalar_one_or_none()
        if cached_record and cached_record.data and len(cached_record.data.get("platform_media", [])) > 0:
            return cached_record.data

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
    def is_matching_platform(acc_platform_str: str, target_p: str) -> bool:
        acc_p = (acc_platform_str or "").lower()
        target_p = (target_p or "").lower()
        if target_p.startswith("facebook"):
            return acc_p.startswith("facebook")
        if target_p.startswith("instagram"):
            return acc_p.startswith("instagram")
        return acc_p == target_p

    platform_accounts = [
        {
            "id": str(acc.id),
            "platform": acc.platform.value if hasattr(acc.platform, "value") else str(acc.platform),
            "username": acc.username or acc.platform_user_id or "Connected Account",
            "platform_user_id": acc.platform_user_id,
            "created_at": acc.created_at.isoformat() if acc.created_at else None,
        }
        for acc in all_accounts
        if is_matching_platform(acc.platform.value if hasattr(acc.platform, "value") else str(acc.platform), p_lower)
    ]

    # Select target account
    selected_account_dict = None
    selected_account_obj = None
    if account_id:
        selected_account_obj = next((a for a in all_accounts if str(a.id) == account_id), None)
    if not selected_account_obj and all_accounts:
        # Match platform first
        selected_account_obj = next(
            (a for a in all_accounts if (a.platform.value if hasattr(a.platform, "value") else str(a.platform)).lower() == p_lower),
            None
        )

    if selected_account_obj:
        selected_account_dict = {
            "id": str(selected_account_obj.id),
            "platform": selected_account_obj.platform.value if hasattr(selected_account_obj.platform, "value") else str(selected_account_obj.platform),
            "username": selected_account_obj.username or selected_account_obj.platform_user_id or "Connected Account",
            "platform_user_id": selected_account_obj.platform_user_id,
            "created_at": selected_account_obj.created_at.isoformat() if selected_account_obj.created_at else None,
        }

    # 2. Fetch Live Account Level & Media Analytics from Platform Services
    account_metrics = {}
    platform_media = []

    if selected_account_obj and selected_account_obj.access_token:
        try:
            if p_lower == "youtube":
                svc = YouTubeService(selected_account_obj)
                account_metrics = await svc.get_channel_analytics()
                platform_media = await svc.get_video_analytics(uploads_playlist=account_metrics.get("uploads_playlist", ""))
                if account_metrics.get("total_views", 0) == 0 and platform_media:
                    computed_views = sum(int(m.get("views", 0)) for m in platform_media)
                    if computed_views > 0:
                        account_metrics["total_views"] = computed_views
            elif p_lower == "instagram":
                svc = InstagramService(selected_account_obj)
                account_metrics = await svc.get_account_analytics()
                platform_media = await svc.get_media_analytics()
            elif p_lower == "facebook":
                svc = FacebookService(selected_account_obj)
                account_metrics = await svc.get_page_analytics()
                platform_media = await svc.get_post_analytics()
        except Exception:
            pass

    # 3. Query local scheduled/published posts from Database
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

    if selected_account_dict:
        posts_query = posts_query.where(
            or_(
                ScheduledPost.connected_account_id == selected_account_dict["id"],
                ScheduledPost.connected_account_id.is_(None)
            )
        )

    posts_query = posts_query.order_by(ScheduledPost.created_at.desc())
    posts_result = await db.execute(posts_query)
    rows = posts_result.all()

    total_posts = len(rows)
    published_count = sum(1 for post, _ in rows if post.status == PostStatus.PUBLISHED)
    scheduled_count = sum(1 for post, _ in rows if post.status == PostStatus.SCHEDULED)
    failed_count = sum(1 for post, _ in rows if post.status == PostStatus.FAILED)
    draft_count = sum(1 for post, _ in rows if post.status == PostStatus.DRAFT)

    local_videos = []
    for post, video in rows:
        local_videos.append({
            "id": str(post.id),
            "video_id": str(video.id),
            "title": post.title or post.caption or post.post_text or video.title or "Untitled Short",
            "status": post.status.value if hasattr(post.status, "value") else str(post.status),
            "scheduled_at": post.schedule_datetime.isoformat() if post.schedule_datetime else None,
            "published_at": post.published_at.isoformat() if post.published_at else None,
            "platform_post_id": post.platform_post_id,
            "error_message": post.error_message,
        })

    response_data = {
        "platform": p_lower,
        "connected_accounts": platform_accounts,
        "selected_account": selected_account_dict,
        "account_metrics": account_metrics,
        "platform_media": platform_media,
        "stats": {
            "total_posts": total_posts,
            "published": published_count,
            "scheduled": scheduled_count,
            "failed": failed_count,
            "drafts": draft_count,
        },
        "videos": local_videos,
        "cached_at": now_utc.isoformat(),
    }

    # Upsert to Dedicated Cache Database analytics_cache table
    expires_at = now_utc + timedelta(hours=24)
    existing_cache_query = select(AnalyticsCache).where(
        and_(
            AnalyticsCache.user_id == current_user.id,
            AnalyticsCache.cache_key == cache_key,
        )
    )
    existing_cache = (await cache_db.execute(existing_cache_query)).scalar_one_or_none()

    if existing_cache:
        existing_cache.data = response_data
        existing_cache.expires_at = expires_at
    else:
        new_cache = AnalyticsCache(
            user_id=current_user.id,
            cache_key=cache_key,
            data=response_data,
            expires_at=expires_at,
        )
        cache_db.add(new_cache)

    await cache_db.commit()
    await cache_service.set(cache_key, response_data, ttl_seconds=86400)
    return response_data
