"""
Video Pydantic schemas.
"""
from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel


class VideoResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    video_url: str
    thumbnail_url: Optional[str] = None
    duration: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    size: Optional[int] = None
    mime_type: Optional[str] = None
    original_filename: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class VideoUploadResponse(BaseModel):
    video: VideoResponse
    message: str = "Video uploaded successfully"


class ThumbnailUploadResponse(BaseModel):
    video_id: uuid.UUID
    thumbnail_url: str
    message: str = "Thumbnail uploaded successfully"
