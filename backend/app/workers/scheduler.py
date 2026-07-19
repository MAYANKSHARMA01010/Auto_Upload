"""
Background scheduler — polls the database every 60 seconds for due posts
and publishes them using the appropriate platform connector.

Architecture:
  APScheduler (AsyncIO scheduler) → poll_and_publish() → ConnectorRegistry → Platform API
"""
import asyncio
import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.database.session import AsyncSessionLocal
from app.integrations import get_connector
from app.models.activity_log import ActivityAction
from app.models.scheduled_post import PostStatus
from app.services.activity_log_service import ActivityLogService
from app.services.post_service import PostService
from app.services.storage_service import storage_service

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = AsyncIOScheduler()


async def poll_and_publish() -> None:
    """
    Core scheduler job — runs every 60 seconds.
    1. Queries DB for posts with status=SCHEDULED and schedule_datetime <= now
    2. For each post: fetches video bytes, calls connector.upload() + publish()
    3. Updates post status to PUBLISHED or FAILED
    4. Logs every action to activity_logs
    """
    async with AsyncSessionLocal() as db:
        try:
            due_posts = await PostService.get_due_posts(db)

            if not due_posts:
                return

            logger.info(f"Scheduler: found {len(due_posts)} post(s) due for publishing")

            for post in due_posts:
                await _process_post(db, post)

        except Exception as exc:
            logger.error(f"Scheduler poll error: {exc}", exc_info=True)


async def _process_post(db, post) -> None:
    """Process a single due post — upload and publish."""
    from sqlalchemy import select
    from app.models.connected_account import ConnectedAccount

    try:
        # Mark as uploading
        await PostService.update_status(db, post, PostStatus.UPLOADING)
        logger.info(f"Processing post {post.id} for platform {post.platform}")

        # Fetch the connected account for this user + platform
        result = await db.execute(
            select(ConnectedAccount).where(
                ConnectedAccount.user_id == post.user_id,
                ConnectedAccount.platform == post.platform,
                ConnectedAccount.is_active == True,
            )
        )
        account = result.scalar_one_or_none()

        if not account:
            raise RuntimeError(
                f"No connected account found for platform {post.platform}"
            )

        # Instantiate connector
        connector = get_connector(post.platform, account)

        # Try to connect (may refresh token)
        connected = await connector.connect()
        if not connected:
            # Try token refresh
            refreshed = await connector.refresh_token()
            if not refreshed:
                raise RuntimeError("Platform authentication failed — token expired or invalid")
            connected = await connector.connect()
            if not connected:
                raise RuntimeError("Platform authentication failed after token refresh")

        # Download video bytes from R2
        video_bytes = storage_service.download_to_bytes(post.video.video_key)

        # Upload to platform
        upload_id = await connector.upload(post, video_bytes)

        # Publish
        platform_post_id = await connector.publish(post, upload_id)

        # Mark as published
        await PostService.update_status(
            db, post, PostStatus.PUBLISHED, platform_post_id=platform_post_id
        )

        # Log success
        await ActivityLogService.log(
            db,
            user_id=post.user_id,
            action=ActivityAction.POST_PUBLISHED,
            description=f"Post published to {post.platform.value}",
            resource_type="scheduled_post",
            resource_id=str(post.id),
            metadata={"platform": post.platform.value, "platform_post_id": platform_post_id},
        )

        logger.info(f"Post {post.id} published to {post.platform} — ID: {platform_post_id}")

    except Exception as exc:
        error_msg = str(exc)
        logger.error(f"Failed to publish post {post.id}: {error_msg}", exc_info=True)

        # Increment retry count
        post.retry_count = (post.retry_count or 0) + 1

        if post.retry_count >= 3:
            # Give up after 3 retries
            await PostService.update_status(
                db, post, PostStatus.FAILED, error_message=error_msg
            )
            await ActivityLogService.log(
                db,
                user_id=post.user_id,
                action=ActivityAction.POST_FAILED,
                description=f"Post failed to publish to {post.platform.value}: {error_msg}",
                resource_type="scheduled_post",
                resource_id=str(post.id),
                metadata={"error": error_msg, "retries": post.retry_count},
            )
        else:
            # Reset to scheduled for retry
            await PostService.update_status(
                db, post, PostStatus.SCHEDULED, error_message=error_msg
            )


def start_scheduler() -> None:
    """Start the APScheduler background job."""
    scheduler.add_job(
        poll_and_publish,
        trigger=IntervalTrigger(seconds=60),
        id="poll_and_publish",
        name="Poll and publish due posts",
        replace_existing=True,
        max_instances=1,
    )
    scheduler.start()
    logger.info("Background scheduler started — polling every 60 seconds")


def stop_scheduler() -> None:
    """Gracefully stop the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Background scheduler stopped")
