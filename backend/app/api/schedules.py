"""
Schedules API — CRUD for scheduled posts (all platforms).
"""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.activity_log import ActivityAction
from app.models.scheduled_post import Platform, PostStatus
from app.models.user import User
from app.schemas.post import BulkScheduleRequest, ScheduledPostCreate, ScheduledPostResponse, ScheduledPostUpdate
from app.services.activity_log_service import ActivityLogService
from app.services.post_service import PostService

router = APIRouter(prefix="/schedules", tags=["Schedules"])


@router.post("/bulk", response_model=list[ScheduledPostResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_posts(
    data: BulkScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create multiple scheduled posts at once (one per platform).
    This is the main endpoint called by the Upload Wizard.
    """
    posts = await PostService.bulk_create(db, current_user.id, data.posts)

    status_label = "Scheduled" if data.posts and data.posts[0].status == PostStatus.SCHEDULED else "Draft"

    await ActivityLogService.log(
        db,
        user_id=current_user.id,
        action=ActivityAction.POST_SCHEDULED if status_label == "Scheduled" else ActivityAction.DRAFT_SAVED,
        description=f"{status_label}: {len(posts)} post(s) created across {len(set(p.platform for p in posts))} platform(s)",
        resource_type="video",
        resource_id=str(data.video_id),
    )

    return [ScheduledPostResponse.model_validate(p) for p in posts]


@router.post("", response_model=ScheduledPostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    data: ScheduledPostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a single scheduled post."""
    post = await PostService.create(db, current_user.id, data)
    return ScheduledPostResponse.model_validate(post)


@router.get("", response_model=list[ScheduledPostResponse])
async def list_posts(
    status: Optional[PostStatus] = Query(None),
    platform: Optional[Platform] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List scheduled posts with optional filters."""
    posts = await PostService.list_by_user(
        db, current_user.id, status=status, platform=platform, skip=skip, limit=limit
    )
    return [ScheduledPostResponse.model_validate(p) for p in posts]


@router.get("/{post_id}", response_model=ScheduledPostResponse)
async def get_post(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific scheduled post."""
    post = await PostService.get_by_id(db, post_id, current_user.id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return ScheduledPostResponse.model_validate(post)


@router.patch("/{post_id}", response_model=ScheduledPostResponse)
async def update_post(
    post_id: uuid.UUID,
    data: ScheduledPostUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a scheduled post (metadata, schedule time, status)."""
    post = await PostService.get_by_id(db, post_id, current_user.id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    post = await PostService.update(db, post, data)
    return ScheduledPostResponse.model_validate(post)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a scheduled post."""
    post = await PostService.get_by_id(db, post_id, current_user.id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    await PostService.delete(db, post)
    await ActivityLogService.log(
        db,
        user_id=current_user.id,
        action=ActivityAction.POST_DELETED,
        description=f"Post deleted from {post.platform.value}",
        resource_type="scheduled_post",
        resource_id=str(post_id),
    )


@router.post("/{post_id}/cancel", response_model=ScheduledPostResponse)
async def cancel_post(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a scheduled post."""
    post = await PostService.get_by_id(db, post_id, current_user.id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if post.status != PostStatus.SCHEDULED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel a post with status '{post.status}'",
        )
    post = await PostService.update_status(db, post, PostStatus.CANCELLED)
    await ActivityLogService.log(
        db,
        user_id=current_user.id,
        action=ActivityAction.POST_CANCELLED,
        description=f"Post cancelled for {post.platform.value}",
        resource_type="scheduled_post",
        resource_id=str(post_id),
    )
    return ScheduledPostResponse.model_validate(post)


@router.post("/{post_id}/retry", response_model=ScheduledPostResponse)
async def retry_post(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retry a failed post."""
    post = await PostService.get_by_id(db, post_id, current_user.id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if post.status != PostStatus.FAILED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Can only retry posts with status 'failed'",
        )
    post.retry_count = 0
    post = await PostService.update_status(db, post, PostStatus.SCHEDULED)
    await ActivityLogService.log(
        db,
        user_id=current_user.id,
        action=ActivityAction.POST_RETRIED,
        description=f"Post retried for {post.platform.value}",
        resource_type="scheduled_post",
        resource_id=str(post_id),
    )
    return ScheduledPostResponse.model_validate(post)
