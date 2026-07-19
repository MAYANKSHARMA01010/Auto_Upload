"""
Connected Accounts API — OAuth initiation, callback, list, and disconnect.
"""
import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.integrations import OAUTH_URL_GENERATORS
from app.models.activity_log import ActivityAction
from app.models.connected_account import ConnectedAccount
from app.models.scheduled_post import Platform
from app.models.user import User
from app.schemas.account import ConnectedAccountResponse, OAuthInitResponse
from app.services.activity_log_service import ActivityLogService

router = APIRouter(prefix="/accounts", tags=["Connected Accounts"])


@router.get("", response_model=list[ConnectedAccountResponse])
async def list_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all connected platform accounts for the current user."""
    result = await db.execute(
        select(ConnectedAccount).where(ConnectedAccount.user_id == current_user.id)
    )
    accounts = result.scalars().all()
    return [ConnectedAccountResponse.model_validate(a) for a in accounts]


@router.get("/oauth/{platform}/init", response_model=OAuthInitResponse)
async def init_oauth(
    platform: Platform,
    current_user: User = Depends(get_current_user),
):
    """Generate the OAuth authorization URL for a platform."""
    generator = OAUTH_URL_GENERATORS.get(platform)
    if not generator:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No OAuth configured for platform: {platform}",
        )
    state = secrets.token_urlsafe(32)
    auth_url = generator(state)
    return OAuthInitResponse(authorization_url=auth_url, state=state)


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_account(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Disconnect a platform account."""
    result = await db.execute(
        select(ConnectedAccount).where(
            ConnectedAccount.id == account_id,
            ConnectedAccount.user_id == current_user.id,
        )
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    platform_name = account.platform.value
    await db.delete(account)
    await db.commit()

    await ActivityLogService.log(
        db,
        user_id=current_user.id,
        action=ActivityAction.ACCOUNT_DISCONNECTED,
        description=f"{platform_name} account disconnected",
        resource_type="connected_account",
        resource_id=str(account_id),
    )
