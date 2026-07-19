import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings
from app.database.base import Base
from app.models.refresh_token import RefreshToken # Ensure it's imported

async def alter_db():
    engine = create_async_engine(str(settings.DATABASE_URL))
    async with engine.begin() as conn:
        try:
            await conn.run_sync(Base.metadata.create_all)
            print("Successfully created tables (including refresh_tokens)")
        except Exception as e:
            print(f"Error: {e}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(alter_db())
