"""
Auth API routes — register, login, logout, refresh, forgot/reset password.
"""
import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings

from app.core.dependencies import get_current_user, get_db
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    create_refresh_token_string,
    verify_token,
)
from sqlalchemy import select, delete
from datetime import datetime, timezone, timedelta
from app.models.refresh_token import RefreshToken
from app.models.activity_log import ActivityAction
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from app.services.activity_log_service import ActivityLogService
from app.services.user_service import UserService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user account."""
    existing = await UserService.get_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
    user = await UserService.create(db, data)
    await ActivityLogService.log(
        db,
        user_id=user.id,
        action=ActivityAction.USER_REGISTERED,
        description=f"User {user.email} registered",
    )
    return _user_to_response(user)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """Authenticate and receive JWT tokens."""
    user = await UserService.authenticate(db, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )
    
    token_str = create_refresh_token_string()
    
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    db_token = RefreshToken(user_id=user.id, token=token_str, expires_at=expires_at)
    db.add(db_token)
    await db.commit()
    
    response.set_cookie(
        key="refresh_token",
        value=token_str,
        httponly=True,
        secure=(settings.ENVIRONMENT != "development"),
        samesite="lax",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Exchange a refresh token (from cookie) for a new access token."""
    refresh_token_cookie = request.cookies.get("refresh_token")
    if not refresh_token_cookie:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing"
        )
        
    stmt = select(RefreshToken).where(RefreshToken.token == refresh_token_cookie)
    result = await db.execute(stmt)
    db_token = result.scalar_one_or_none()
        
    if not db_token or db_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token"
        )
        
    user = await UserService.get_by_id(db, db_token.user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or disabled"
        )
        
    # Rotate token
    new_token_str = create_refresh_token_string()
    db_token.token = new_token_str
    db_token.expires_at = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    await db.commit()
    
    response.set_cookie(
        key="refresh_token",
        value=new_token_str,
        httponly=True,
        secure=(settings.ENVIRONMENT != "development"),
        samesite="lax",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    
    return TokenResponse(access_token=create_access_token(user.id))

@router.post("/logout", response_model=MessageResponse)
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Log out by clearing the refresh token cookie and removing it from the database."""
    refresh_token_cookie = request.cookies.get("refresh_token")
    if refresh_token_cookie:
        stmt = delete(RefreshToken).where(RefreshToken.token == refresh_token_cookie)
        await db.execute(stmt)
        await db.commit()
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=(settings.ENVIRONMENT != "development"),
        samesite="lax"
    )
    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return _user_to_response(current_user)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Send a password reset email."""
    user = await UserService.get_by_email(db, data.email)
    # Always return success to prevent email enumeration
    if user:
        reset_token = create_password_reset_token(user.email)
        background_tasks.add_task(_send_reset_email, user.email, reset_token)
    return MessageResponse(
        message="If an account exists with this email, a password reset link has been sent."
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)
):
    """Reset password using a valid reset token."""
    email = verify_token(data.token, token_type="password_reset")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    user = await UserService.get_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    await UserService.update_password(db, user, data.new_password)
    await ActivityLogService.log(
        db,
        user_id=user.id,
        action=ActivityAction.PASSWORD_RESET,
        description="Password was reset",
    )
    return MessageResponse(message="Password has been reset successfully")


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        is_active=user.is_active,
        avatar_url=user.avatar_url,
        created_at=user.created_at.isoformat(),
    )


async def _send_reset_email(email: str, token: str) -> None:
    """Background task: send password reset email (stub)."""
    from app.core.config import settings
    logger.info(f"[STUB] Send reset email to {email} — token: {token}")
    # TODO: Implement real SMTP email sending via smtplib or a service like SendGrid
