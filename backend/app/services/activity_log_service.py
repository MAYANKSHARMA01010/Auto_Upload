"""
ActivityLogService — records every meaningful action to the activity_logs table.
"""
import uuid
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_log import ActivityAction, ActivityLog


class ActivityLogService:
    """Records and retrieves activity log entries."""

    @staticmethod
    async def log(
        db: AsyncSession,
        user_id: uuid.UUID,
        action: ActivityAction,
        description: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> ActivityLog:
        entry = ActivityLog(
            user_id=user_id,
            action=action,
            description=description,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata_json=metadata,
        )
        db.add(entry)
        await db.commit()
        await db.refresh(entry)
        return entry

    @staticmethod
    async def list_by_user(
        db: AsyncSession,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[ActivityLog], int]:
        from sqlalchemy import func

        count_result = await db.execute(
            select(func.count()).where(ActivityLog.user_id == user_id)
        )
        total = count_result.scalar_one()

        result = await db.execute(
            select(ActivityLog)
            .where(ActivityLog.user_id == user_id)
            .order_by(ActivityLog.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all()), total
