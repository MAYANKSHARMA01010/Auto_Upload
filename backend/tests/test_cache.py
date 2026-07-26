import pytest
from app.core.cache import CacheService

@pytest.mark.asyncio
async def test_cache_service_memory():
    cache = CacheService()
    await cache.initialize(redis_url=None)

    # Set and Get
    await cache.set("test_key", {"foo": "bar"}, ttl_seconds=10)
    res = await cache.get("test_key")
    assert res == {"foo": "bar"}

    # Delete
    await cache.delete("test_key")
    res2 = await cache.get("test_key")
    assert res2 is None

    # Pattern delete
    await cache.set("user_accounts:1", [1, 2], ttl_seconds=10)
    await cache.set("user_accounts:2", [3, 4], ttl_seconds=10)
    await cache.delete_pattern("user_accounts:")
    assert await cache.get("user_accounts:1") is None
    assert await cache.get("user_accounts:2") is None
