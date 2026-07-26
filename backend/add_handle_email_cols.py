"""
Migration: Add handle and email columns to connected_accounts table.
Run once with: python add_handle_email_cols.py
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.core.config import settings


async def migrate():
    engine = create_async_engine(str(settings.DATABASE_URL))
    async with engine.begin() as conn:
        # Add handle column if not exists
        try:
            await conn.execute(text(
                "ALTER TABLE connected_accounts ADD COLUMN IF NOT EXISTS handle VARCHAR(255);"
            ))
            print("✅ Added 'handle' column")
        except Exception as e:
            print(f"  handle column: {e}")

        # Add email column if not exists
        try:
            await conn.execute(text(
                "ALTER TABLE connected_accounts ADD COLUMN IF NOT EXISTS email VARCHAR(255);"
            ))
            print("✅ Added 'email' column")
        except Exception as e:
            print(f"  email column: {e}")

    await engine.dispose()
    print("✅ Migration complete!")


if __name__ == "__main__":
    asyncio.run(migrate())
