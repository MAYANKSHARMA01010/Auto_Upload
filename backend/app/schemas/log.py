"""
ActivityLog Pydantic schemas.
"""
from datetime import datetime
from typing import Optional, Any
import uuid

from pydantic import BaseModel
from app.models.activity_log import ActivityAction


class ActivityLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    action: ActivityAction
    description: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    metadata_json: Optional[dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ActivityLogListResponse(BaseModel):
    logs: list[ActivityLogResponse]
    total: int
    page: int
    per_page: int
