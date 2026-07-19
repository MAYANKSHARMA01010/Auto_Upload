import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings

async def alter_db():
    engine = create_async_engine(str(settings.DATABASE_URL))
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE scheduled_posts ADD COLUMN connected_account_id UUID REFERENCES connected_accounts(id) ON DELETE CASCADE;"))
            print("Successfully added column")
        except Exception as e:
            print(f"Error (might already exist): {e}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(alter_db())
