"""
PostService — business logic for scheduled post CRUD and status management.
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scheduled_post import Platform, PostStatus, ScheduledPost
from app.schemas.post import ScheduledPostCreate, ScheduledPostUpdate


class PostService:
    """CRUD and query operations for ScheduledPost."""

    @staticmethod
    async def create(
        db: AsyncSession, user_id: uuid.UUID, data: ScheduledPostCreate
    ) -> ScheduledPost:
        post = ScheduledPost(user_id=user_id, **data.model_dump())
        db.add(post)
        await db.commit()
        await db.refresh(post)
        return post

    @staticmethod
    async def bulk_create(
        db: AsyncSession, user_id: uuid.UUID, posts_data: List[ScheduledPostCreate]
    ) -> List[ScheduledPost]:
        posts = [ScheduledPost(user_id=user_id, **d.model_dump()) for d in posts_data]
        db.add_all(posts)
        await db.commit()
        for p in posts:
            await db.refresh(p)
        return posts

    @staticmethod
    async def get_by_id(
        db: AsyncSession, post_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[ScheduledPost]:
        result = await db.execute(
            select(ScheduledPost).where(
                ScheduledPost.id == post_id, ScheduledPost.user_id == user_id
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_by_user(
        db: AsyncSession,
        user_id: uuid.UUID,
        status: Optional[PostStatus] = None,
        platform: Optional[Platform] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[ScheduledPost]:
        query = select(ScheduledPost).where(ScheduledPost.user_id == user_id)
        if status:
            query = query.where(ScheduledPost.status == status)
        if platform:
            query = query.where(ScheduledPost.platform == platform)
        query = query.order_by(ScheduledPost.schedule_datetime.asc().nullslast()).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def update(
        db: AsyncSession, post: ScheduledPost, data: ScheduledPostUpdate
    ) -> ScheduledPost:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(post, field, value)
        await db.commit()
        await db.refresh(post)
        return post

    @staticmethod
    async def delete(db: AsyncSession, post: ScheduledPost) -> None:
        await db.delete(post)
        await db.commit()

    @staticmethod
    async def get_due_posts(db: AsyncSession) -> List[ScheduledPost]:
        """Fetch posts that are scheduled and past their schedule time."""
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(ScheduledPost).where(
                and_(
                    ScheduledPost.status == PostStatus.SCHEDULED,
                    ScheduledPost.schedule_datetime <= now,
                )
            )
        )
        return list(result.scalars().all())

    @staticmethod
    async def update_status(
        db: AsyncSession,
        post: ScheduledPost,
        status: PostStatus,
        error_message: Optional[str] = None,
        platform_post_id: Optional[str] = None,
    ) -> ScheduledPost:
        post.status = status
        if error_message is not None:
            post.error_message = error_message
        if platform_post_id is not None:
            post.platform_post_id = platform_post_id
        if status == PostStatus.PUBLISHED:
            post.published_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(post)
        return post

    @staticmethod
    async def get_calendar_posts(
        db: AsyncSession,
        user_id: uuid.UUID,
        start: datetime,
        end: datetime,
    ) -> List[ScheduledPost]:
        result = await db.execute(
            select(ScheduledPost).where(
                and_(
                    ScheduledPost.user_id == user_id,
                    ScheduledPost.schedule_datetime >= start,
                    ScheduledPost.schedule_datetime <= end,
                )
            ).order_by(ScheduledPost.schedule_datetime.asc())
        )
        return list(result.scalars().all())
