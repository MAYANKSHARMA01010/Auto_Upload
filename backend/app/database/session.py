"""
Async SQLAlchemy engine and session factory.
"""
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# Primary Async Database Engine
engine = create_async_engine(
    settings.formatted_database_url,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=300,
    pool_timeout=30,
)

# Dedicated Cache Async Database Engine
cache_engine = create_async_engine(
    settings.formatted_database_cache_url,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=300,
    pool_timeout=30,
)

# Session factories
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

AsyncCacheSessionLocal = async_sessionmaker(
    bind=cache_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def init_db() -> None:
    """Import models and initialize tables on both primary & cache database engines."""
    from app.database.base import Base
    import app.models  # noqa: F401 – ensures all models are registered

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with cache_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Dispose engine connections on shutdown."""
    await engine.dispose()
    await cache_engine.dispose()
