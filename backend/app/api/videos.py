"""
Videos API — upload video and thumbnail, list and delete videos.
"""
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache_service
from app.core.dependencies import get_current_user, get_db
from app.models.activity_log import ActivityAction
from app.models.user import User
from app.schemas.video import ThumbnailUploadResponse, VideoResponse, VideoUploadResponse
from app.services.activity_log_service import ActivityLogService
from app.services.video_service import VideoService

router = APIRouter(prefix="/videos", tags=["Videos"])

ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/mpeg"}
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_VIDEO_SIZE = 500 * 1024 * 1024   # 500 MB
MAX_IMAGE_SIZE = 20 * 1024 * 1024    # 20 MB


@router.post("/upload", response_model=VideoUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_video(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a video file to R2 storage and extract metadata via FFmpeg."""
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported video type: {file.content_type}. Allowed: {', '.join(ALLOWED_VIDEO_TYPES)}",
        )

    file_bytes = await file.read()

    if len(file_bytes) > MAX_VIDEO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Video file too large. Max 500 MB allowed.",
        )

    video = await VideoService.upload_video(
        db=db,
        user_id=current_user.id,
        file_bytes=file_bytes,
        original_filename=file.filename or "video.mp4",
        mime_type=file.content_type,
    )

    await ActivityLogService.log(
        db,
        user_id=current_user.id,
        action=ActivityAction.VIDEO_UPLOADED,
        description=f"Video '{file.filename}' uploaded",
        resource_type="video",
        resource_id=str(video.id),
    )

    await cache_service.delete_pattern(f"user_videos:{current_user.id}")
    await cache_service.delete(f"user_analytics_overview:{current_user.id}")

    return VideoUploadResponse(video=VideoResponse.model_validate(video))


@router.post("/{video_id}/thumbnail", response_model=ThumbnailUploadResponse)
async def upload_thumbnail(
    video_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a thumbnail image for an existing video."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported image type: {file.content_type}",
        )

    file_bytes = await file.read()

    if len(file_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image too large. Max 20 MB allowed.",
        )

    video = await VideoService.get_by_id(db, video_id, current_user.id)
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    video = await VideoService.upload_thumbnail(
        db=db,
        video=video,
        file_bytes=file_bytes,
        original_filename=file.filename or "thumbnail.jpg",
    )

    await ActivityLogService.log(
        db,
        user_id=current_user.id,
        action=ActivityAction.THUMBNAIL_UPLOADED,
        description="Thumbnail uploaded",
        resource_type="video",
        resource_id=str(video.id),
    )

    return ThumbnailUploadResponse(
        video_id=video.id,
        thumbnail_url=video.thumbnail_url,
    )


@router.get("", response_model=list[VideoResponse])
async def list_videos(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all videos uploaded by the current user (cached)."""
    cache_key = f"user_videos:{current_user.id}:{skip}:{limit}"
    cached = await cache_service.get(cache_key)
    if cached is not None:
        return [VideoResponse.model_validate(v) for v in cached]

    videos = await VideoService.list_by_user(db, current_user.id, skip=skip, limit=limit)
    res_data = [VideoResponse.model_validate(v).model_dump(mode="json") for v in videos]
    await cache_service.set(cache_key, res_data, ttl_seconds=300)
    return [VideoResponse.model_validate(v) for v in videos]


@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific video by ID."""
    video = await VideoService.get_by_id(db, video_id, current_user.id)
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    return VideoResponse.model_validate(video)


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_video(
    video_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a video and its R2 objects."""
    video = await VideoService.get_by_id(db, video_id, current_user.id)
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    await VideoService.delete(db, video)
    await cache_service.delete_pattern(f"user_videos:{current_user.id}")
    await cache_service.delete(f"user_analytics_overview:{current_user.id}")
