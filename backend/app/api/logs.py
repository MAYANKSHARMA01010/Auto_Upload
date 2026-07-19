"""
Activity Logs API — paginated log listing.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.log import ActivityLogListResponse, ActivityLogResponse
from app.services.activity_log_service import ActivityLogService

router = APIRouter(prefix="/logs", tags=["Activity Logs"])


@router.get("", response_model=ActivityLogListResponse)
async def list_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get paginated activity logs for the current user."""
    skip = (page - 1) * per_page
    logs, total = await ActivityLogService.list_by_user(db, current_user.id, skip=skip, limit=per_page)
    return ActivityLogListResponse(
        logs=[ActivityLogResponse.model_validate(log) for log in logs],
        total=total,
        page=page,
        per_page=per_page,
    )
