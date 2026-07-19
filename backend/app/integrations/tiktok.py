"""
TikTok connector — uses TikTok for Developers API v2.
"""
import httpx

from app.integrations.base import BasePlatformConnector
from app.models.scheduled_post import ScheduledPost
from app.core.config import settings


class TikTokService(BasePlatformConnector):
    """TikTok connector using TikTok for Developers API."""

    API_BASE = "https://open.tiktokapis.com/v2"
    AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/"
    TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/"

    @classmethod
    def get_oauth_url(cls, state: str) -> str:
        import urllib.parse
        params = {
            "client_key": settings.TIKTOK_CLIENT_KEY,
            "redirect_uri": settings.TIKTOK_REDIRECT_URI,
            "scope": "user.info.basic,video.publish,video.upload",
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
                    f"{self.API_BASE}/user/info/",
                    headers={**self._headers(), "Content-Type": "application/json"},
                    params={"fields": "open_id,display_name"},
                    timeout=10,
                )
                return resp.status_code == 200
        except Exception:
            return False

    async def upload(self, post: ScheduledPost, video_bytes: bytes) -> str:
        raise NotImplementedError("Configure TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET.")

    async def publish(self, post: ScheduledPost, upload_id: str) -> str:
        raise NotImplementedError("Configure TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET.")

    async def schedule(self, post: ScheduledPost, video_bytes: bytes) -> str:
        return await self.upload(post, video_bytes)

    async def delete(self, platform_post_id: str) -> bool:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{self.API_BASE}/video/delete/",
                    headers=self._headers(),
                    json={"video_id": platform_post_id},
                )
                return resp.status_code == 200
        except Exception:
            return False

    async def get_status(self, platform_post_id: str) -> str:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{self.API_BASE}/video/query/",
                    headers=self._headers(),
                    json={"filters": {"video_ids": [platform_post_id]}, "fields": ["status"]},
                )
                if resp.status_code == 200:
                    data = resp.json().get("data", {})
                    videos = data.get("videos", [])
                    if videos:
                        return videos[0].get("status", "unknown")
        except Exception:
            pass
        return "unknown"
