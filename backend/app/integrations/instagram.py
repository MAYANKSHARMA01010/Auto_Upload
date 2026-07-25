"""
Instagram Reels connector — uses Meta Graph API.
Requires: Instagram Business/Creator account + Facebook App.
"""
import httpx

from app.integrations.base import BasePlatformConnector
from app.models.connected_account import ConnectedAccount
from app.models.scheduled_post import ScheduledPost
from app.core.config import settings


class InstagramService(BasePlatformConnector):
    """Instagram Reels connector via Meta Graph API."""

    GRAPH_URL = "https://graph.facebook.com/v19.0"
    AUTH_URL = "https://www.instagram.com/oauth/authorize"
    TOKEN_URL = "https://api.instagram.com/oauth/access_token"

    @classmethod
    def get_oauth_url(cls, state: str) -> str:
        import urllib.parse
        params = {
            "client_id": settings.INSTAGRAM_CLIENT_ID,
            "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
            "scope": "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments",
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
                    params={"access_token": self.account.access_token, "fields": "id,name"},
                    timeout=10,
                )
                return resp.status_code == 200
        except Exception:
            return False

    async def upload(self, post: ScheduledPost, video_bytes: bytes) -> str:
        """
        Instagram Reels upload requires:
        1. Create media container with video URL
        2. Publish container
        NOTE: Video must be publicly accessible via URL (hosted on R2).
        """
        raise NotImplementedError(
            "Instagram upload requires real Meta Graph API credentials."
        )

    async def publish(self, post: ScheduledPost, upload_id: str) -> str:
        raise NotImplementedError("Configure INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET.")

    async def schedule(self, post: ScheduledPost, video_bytes: bytes) -> str:
        return await self.upload(post, video_bytes)

    async def delete(self, platform_post_id: str) -> bool:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.delete(
                    f"{self.GRAPH_URL}/{platform_post_id}",
                    params={"access_token": self.account.access_token},
                )
                return resp.status_code == 200
        except Exception:
            return False

    async def get_status(self, platform_post_id: str) -> str:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.GRAPH_URL}/{platform_post_id}",
                    params={"access_token": self.account.access_token, "fields": "status_code"},
                )
                if resp.status_code == 200:
                    return resp.json().get("status_code", "UNKNOWN")
        except Exception:
            pass
        return "unknown"
