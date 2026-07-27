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
            "scope": "instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages",
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

    def _get_api_url(self) -> str:
        token = self.account.access_token or ""
        if token.startswith("IG"):
            return "https://graph.instagram.com"
        return "https://graph.facebook.com/v19.0"

    async def get_account_analytics(self) -> dict:
        """Fetch Instagram profile details and followers count."""
        api_url = self._get_api_url()
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{api_url}/me",
                    params={
                        "access_token": self.account.access_token,
                        "fields": "id,username,name,profile_picture_url,followers_count,media_count,biography",
                    },
                    timeout=10,
                )
                if resp.status_code != 200 and api_url != "https://graph.instagram.com":
                    resp = await client.get(
                        "https://graph.instagram.com/me",
                        params={
                            "access_token": self.account.access_token,
                            "fields": "id,username,name,profile_picture_url,followers_count,media_count,biography",
                        },
                        timeout=10,
                    )
                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        "ig_id": data.get("id", ""),
                        "username": data.get("username", self.account.username or "Instagram Account"),
                        "name": data.get("name", ""),
                        "profile_picture_url": data.get("profile_picture_url", ""),
                        "followers": int(data.get("followers_count", 0)),
                        "total_media": int(data.get("media_count", 0)),
                    }
        except Exception:
            pass
        return {
            "ig_id": self.account.platform_user_id or "",
            "username": self.account.username or "Instagram Account",
            "name": "",
            "profile_picture_url": "",
            "followers": 0,
            "total_media": 0,
        }

    async def get_media_analytics(self, max_results: int = 25) -> list[dict]:
        """Fetch user's Instagram posts/reels with like and comment metrics."""
        items = []
        api_url = self._get_api_url()
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{api_url}/me/media",
                    params={
                        "access_token": self.account.access_token,
                        "fields": "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
                        "limit": max_results,
                    },
                    timeout=10,
                )
                if resp.status_code != 200 and api_url != "https://graph.instagram.com":
                    resp = await client.get(
                        "https://graph.instagram.com/me/media",
                        params={
                            "access_token": self.account.access_token,
                            "fields": "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
                            "limit": max_results,
                        },
                        timeout=10,
                    )
                if resp.status_code == 200:
                    for m in resp.json().get("data", []):
                        caption_text = m.get("caption") or f"Instagram {m.get('media_type', 'Post')}"
                        items.append({
                            "id": m.get("id", ""),
                            "title": caption_text,
                            "caption": caption_text,
                            "media_type": m.get("media_type", "IMAGE"),
                            "thumbnail_url": m.get("thumbnail_url") or m.get("media_url", ""),
                            "permalink": m.get("permalink", ""),
                            "published_at": m.get("timestamp", ""),
                            "views": 0,
                            "likes": int(m.get("like_count", 0)),
                            "reactions": int(m.get("like_count", 0)),
                            "comments": int(m.get("comments_count", 0)),
                        })
        except Exception:
            pass
        return items

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
