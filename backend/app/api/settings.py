"""
Settings API — get and update user preferences.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.activity_log import ActivityAction
from app.models.setting import UserSetting
from app.models.user import User
from app.services.activity_log_service import ActivityLogService

router = APIRouter(prefix="/settings", tags=["Settings"])


class SettingsResponse(BaseModel):
    timezone: str
    language: str
    theme: str
    default_upload_quality: str
    email_notifications: bool

    model_config = {"from_attributes": True}


class SettingsUpdate(BaseModel):
    timezone: str | None = None
    language: str | None = None
    theme: str | None = None
    default_upload_quality: str | None = None
    email_notifications: bool | None = None


@router.get("", response_model=SettingsResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user settings."""
    result = await db.execute(
        select(UserSetting).where(UserSetting.user_id == current_user.id)
    )
    settings = result.scalar_one_or_none()
    if not settings:
        settings = UserSetting(user_id=current_user.id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return SettingsResponse.model_validate(settings)


@router.patch("", response_model=SettingsResponse)
async def update_settings(
    data: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user settings."""
    result = await db.execute(
        select(UserSetting).where(UserSetting.user_id == current_user.id)
    )
    settings = result.scalar_one_or_none()
    if not settings:
        settings = UserSetting(user_id=current_user.id)
        db.add(settings)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)

    await db.commit()
    await db.refresh(settings)

    await ActivityLogService.log(
        db,
        user_id=current_user.id,
        action=ActivityAction.SETTINGS_UPDATED,
        description="User settings updated",
        metadata=update_data,
    )

    return SettingsResponse.model_validate(settings)
