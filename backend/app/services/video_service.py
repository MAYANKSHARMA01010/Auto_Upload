"""
VideoService — business logic for video upload and management.
"""
import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.video import Video
from app.services.storage_service import storage_service
from app.services.ffmpeg_service import ffmpeg_service


class VideoService:
    """Handles video upload to R2 and metadata persistence."""

    @staticmethod
    async def upload_video(
        db: AsyncSession,
        user_id: uuid.UUID,
        file_bytes: bytes,
        original_filename: str,
        mime_type: str,
    ) -> Video:
        """Upload video to R2 and create Video record."""
        # Upload to R2
        result = storage_service.upload_video(file_bytes, original_filename, str(user_id))

        # Extract FFmpeg metadata
        meta = await ffmpeg_service.extract_metadata_async(file_bytes)

        video = Video(
            user_id=user_id,
            video_url=result["public_url"],
            video_key=result["object_key"],
            duration=meta.duration,
            width=meta.width,
            height=meta.height,
            size=len(file_bytes),
            mime_type=mime_type,
            original_filename=original_filename,
        )
        db.add(video)
        await db.commit()
        await db.refresh(video)
        return video

    @staticmethod
    async def upload_thumbnail(
        db: AsyncSession,
        video: Video,
        file_bytes: bytes,
        original_filename: str,
    ) -> Video:
        """Upload thumbnail to R2 and update Video record."""
        result = storage_service.upload_thumbnail(
            file_bytes, original_filename, str(video.user_id)
        )
        video.thumbnail_url = result["public_url"]
        video.thumbnail_key = result["object_key"]
        await db.commit()
        await db.refresh(video)
        return video

    @staticmethod
    async def get_by_id(db: AsyncSession, video_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Video]:
        result = await db.execute(
            select(Video).where(Video.id == video_id, Video.user_id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_by_user(
        db: AsyncSession, user_id: uuid.UUID, skip: int = 0, limit: int = 20
    ) -> List[Video]:
        result = await db.execute(
            select(Video)
            .where(Video.user_id == user_id)
            .order_by(Video.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def delete(db: AsyncSession, video: Video) -> None:
        """Delete video + thumbnail from R2 and DB."""
        storage_service.delete_object(video.video_key)
        if video.thumbnail_key:
            storage_service.delete_object(video.thumbnail_key)
        await db.delete(video)
        await db.commit()
