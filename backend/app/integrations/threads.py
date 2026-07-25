"""
Threads connector — uses Meta Threads API (based on Instagram credentials).
"""
import httpx

from app.integrations.base import BasePlatformConnector
from app.models.scheduled_post import ScheduledPost
from app.core.config import settings


class ThreadsService(BasePlatformConnector):
    """Threads connector using Meta Threads API."""

    GRAPH_URL = "https://graph.threads.net/v1.0"
    AUTH_URL = "https://threads.net/oauth/authorize"
    TOKEN_URL = "https://graph.threads.net/oauth/access_token"

    @classmethod
    def get_oauth_url(cls, state: str) -> str:
        import urllib.parse
        params = {
            "client_id": settings.THREADS_CLIENT_ID,
            "redirect_uri": settings.THREADS_REDIRECT_URI,
            "scope": "threads_basic,threads_content_publish",
            "response_type": "code",
            "state": state,
        }
        return f"{cls.AUTH_URL}?{urllib.parse.urlencode(params)}"

    async def connect(self) -> bool:
        return bool(self.account.access_token) and await self.validate()

    async def validate(self) -> bool:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.GRAPH_URL}/me",
                    params={"access_token": self.account.access_token, "fields": "id,username"},
                    timeout=10,
                )
                return resp.status_code == 200
        except Exception:
            return False

    async def upload(self, post: ScheduledPost, video_bytes: bytes) -> str:
        raise NotImplementedError("Configure THREADS_CLIENT_ID and THREADS_CLIENT_SECRET.")

    async def publish(self, post: ScheduledPost, upload_id: str) -> str:
        raise NotImplementedError("Configure THREADS_CLIENT_ID and THREADS_CLIENT_SECRET.")

    async def schedule(self, post: ScheduledPost, video_bytes: bytes) -> str:
        return await self.upload(post, video_bytes)

    async def delete(self, platform_post_id: str) -> bool:
        return False  # Threads API does not support deletion yet

    async def get_status(self, platform_post_id: str) -> str:
        return "unknown"
