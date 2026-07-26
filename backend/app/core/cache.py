"""
Cache Service — Hybrid Redis & Async In-Memory TTL Cache fallback.

Provides high-performance caching for API responses and user session state.
If Redis is available (via REDIS_URL or local redis-server), it uses Redis.
Otherwise, it seamlessly uses an in-memory dictionary-based TTL cache.
"""
import asyncio
import json
import logging
import time
from typing import Any, Optional

logger = logging.getLogger(__name__)


class CacheItem:
    """In-memory cache entry with TTL."""

    def __init__(self, value: Any, ttl_seconds: int):
        self.value = value
        self.expires_at = time.time() + ttl_seconds

    @property
    def is_expired(self) -> bool:
        return time.time() > self.expires_at


class CacheService:
    """Unified Caching Engine."""

    def __init__(self):
        self._memory_cache: dict[str, CacheItem] = {}
        self._redis_client = None
        self._is_redis_available = False

    async def initialize(self, redis_url: Optional[str] = None):
        """Initialize Redis connection if redis_url is provided, else fallback to memory."""
        if redis_url:
            try:
                import redis.asyncio as aioredis  # type: ignore

                client = aioredis.from_url(redis_url, decode_responses=True)
                await client.ping()
                self._redis_client = client
                self._is_redis_available = True
                logger.info("✅ Redis connected successfully for backend caching.")
                return
            except Exception as e:
                logger.info(f"Redis connection skipped ({e}). Operating in Async In-Memory Cache mode.")

        self._is_redis_available = False
        logger.info("⚡ Backend Caching initialized in Async In-Memory TTL mode.")

    async def close(self):
        """Clean up connections."""
        if self._is_redis_available and self._redis_client:
            try:
                await self._redis_client.close()
            except Exception:
                pass

    async def get(self, key: str) -> Optional[Any]:
        """Retrieve cached value by key."""
        if self._is_redis_available and self._redis_client:
            try:
                val = await self._redis_client.get(key)
                if val is not None:
                    return json.loads(val)
            except Exception as e:
                logger.warning(f"Redis get error for {key}: {e}")

        # In-memory fallback
        item = self._memory_cache.get(key)
        if item:
            if item.is_expired:
                del self._memory_cache[key]
                return None
            return item.value
        return None

    async def set(self, key: str, value: Any, ttl_seconds: int = 300) -> bool:
        """Store value with expiration (default TTL: 300 seconds / 5 mins)."""
        if self._is_redis_available and self._redis_client:
            try:
                serialized = json.dumps(value)
                await self._redis_client.setex(key, ttl_seconds, serialized)
                return True
            except Exception as e:
                logger.warning(f"Redis set error for {key}: {e}")

        # In-memory fallback
        self._memory_cache[key] = CacheItem(value=value, ttl_seconds=ttl_seconds)
        self._clean_expired_memory_keys()
        return True

    async def delete(self, key: str) -> bool:
        """Delete specific cache key."""
        if self._is_redis_available and self._redis_client:
            try:
                await self._redis_client.delete(key)
            except Exception as e:
                logger.warning(f"Redis delete error for {key}: {e}")

        self._memory_cache.pop(key, None)
        return True

    async def delete_pattern(self, pattern_prefix: str) -> bool:
        """Delete all keys starting with prefix."""
        if self._is_redis_available and self._redis_client:
            try:
                keys = await self._redis_client.keys(f"{pattern_prefix}*")
                if keys:
                    await self._redis_client.delete(*keys)
            except Exception as e:
                logger.warning(f"Redis delete_pattern error for {pattern_prefix}: {e}")

        # In-memory fallback
        to_delete = [k for k in self._memory_cache.keys() if k.startswith(pattern_prefix)]
        for k in to_delete:
            self._memory_cache.pop(k, None)
        return True

    def _clean_expired_memory_keys(self):
        """Periodic cleanup of expired keys in memory cache."""
        now = time.time()
        expired = [k for k, item in self._memory_cache.items() if now > item.expires_at]
        for k in expired:
            self._memory_cache.pop(k, None)


# Global singleton instance
cache_service = CacheService()
