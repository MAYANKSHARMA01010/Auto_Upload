"""
Connected Account Pydantic schemas.
"""
from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel

from app.models.scheduled_post import Platform


class ConnectedAccountResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    platform: Platform
    username: Optional[str] = None
    handle: Optional[str] = None
    email: Optional[str] = None
    platform_user_id: Optional[str] = None
    expires_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class OAuthCallbackRequest(BaseModel):
    code: str
    state: Optional[str] = None


class OAuthInitResponse(BaseModel):
    authorization_url: str
    state: str
