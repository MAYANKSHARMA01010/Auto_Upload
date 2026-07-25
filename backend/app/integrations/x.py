"""
X (Twitter) connector — uses Twitter API v2.
"""
import httpx

from app.integrations.base import BasePlatformConnector
from app.models.scheduled_post import ScheduledPost
from app.core.config import settings


class XService(BasePlatformConnector):
    """X (Twitter) connector using Twitter API v2."""

    API_BASE = "https://api.twitter.com/2"
    UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json"
    AUTH_URL = "https://twitter.com/i/oauth2/authorize"
    TOKEN_URL = "https://api.twitter.com/2/oauth2/token"

    @classmethod
    def get_oauth_url(cls, state: str) -> str:
        import urllib.parse, secrets, hashlib, base64
        code_verifier = secrets.token_urlsafe(64)
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode("utf-8")).digest()
        ).decode("utf-8").replace("=", "")
        params = {
            "response_type": "code",
            "client_id": settings.X_API_KEY,
            "redirect_uri": settings.X_REDIRECT_URI,
            "scope": "tweet.read tweet.write users.read media.write offline.access",
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
        }
        return f"{cls.AUTH_URL}?{urllib.parse.urlencode(params)}"

    async def connect(self) -> bool:
        return bool(self.account.access_token) and await self.validate()

    async def validate(self) -> bool:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.API_BASE}/users/me",
                    headers=self._headers(),
                    timeout=10,
                )
                return resp.status_code == 200
        except Exception:
            return False

    async def upload(self, post: ScheduledPost, video_bytes: bytes) -> str:
        """
        X requires chunked media upload then posting a tweet with media_ids.
        Full implementation: https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference/post-media-upload
        """
        raise NotImplementedError("Configure X_API_KEY and X_API_SECRET.")

    async def publish(self, post: ScheduledPost, upload_id: str) -> str:
        raise NotImplementedError("Configure X_API_KEY and X_API_SECRET.")

    async def schedule(self, post: ScheduledPost, video_bytes: bytes) -> str:
        return await self.upload(post, video_bytes)

    async def delete(self, platform_post_id: str) -> bool:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.delete(
                    f"{self.API_BASE}/tweets/{platform_post_id}",
                    headers=self._headers(),
                )
                return resp.status_code == 200
        except Exception:
            return False

    async def get_status(self, platform_post_id: str) -> str:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.API_BASE}/tweets/{platform_post_id}",
                    headers=self._headers(),
                )
                if resp.status_code == 200:
                    return "published"
        except Exception:
            pass
        return "unknown"
