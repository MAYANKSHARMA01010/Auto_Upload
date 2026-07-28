"""
FastAPI dependency injection: database sessions, current user extraction.
"""
import uuid
from typing import AsyncGenerator, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_token
from app.database.session import AsyncSessionLocal, AsyncCacheSessionLocal
from app.models.user import User

bearer_scheme = HTTPBearer()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an async SQLAlchemy session for Primary DB."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_cache_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an async SQLAlchemy session for Dedicated Cache DB."""
    async with AsyncCacheSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Validate JWT access token and return the current authenticated user.
    Raises 401 if token is invalid or user not found.
    """
    from sqlalchemy import select

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    user_id = verify_token(token, token_type="access")

    if user_id is None:
        raise credentials_exception

    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user account"
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Alias dependency that ensures user is active."""
    return current_user
