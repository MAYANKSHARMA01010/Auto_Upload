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
        """Fetch Instagram profile details and followers/following count with resilient field fallbacks."""
        api_url = self._get_api_url()

        field_options = [
            "id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography",
            "id,username,account_type,media_count,followers_count,follows_count",
            "id,username,account_type,media_count",
        ]

        try:
            async with httpx.AsyncClient() as client:
                for fields in field_options:
                    resp = await client.get(
                        f"{api_url}/me",
                        params={"access_token": self.account.access_token, "fields": fields},
                        timeout=4,
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        return {
                            "ig_id": data.get("id", ""),
                            "username": data.get("username", self.account.username or "Instagram Account"),
                            "name": data.get("name", ""),
                            "profile_picture_url": data.get("profile_picture_url", ""),
                            "followers": int(data.get("followers_count", 0)),
                            "following": int(data.get("follows_count", 0)),
                            "total_media": int(data.get("media_count", 0)),
                        }
                    if resp.status_code == 401:
                        break
        except Exception:
            pass
        return {
            "ig_id": self.account.platform_user_id or "",
            "username": self.account.username or "Instagram Account",
            "name": "",
            "profile_picture_url": "",
            "followers": 0,
            "following": 0,
            "total_media": 0,
        }

    async def get_media_analytics(self, max_results: int = 25) -> list[dict]:
        """Fetch user's Instagram posts/reels with like, comment, and view/play count metrics."""
        items = []
        api_url = self._get_api_url()
        is_basic_token = (self.account.access_token or "").startswith("IG")

        field_options = [
            "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
            "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp",
        ]

        try:
            async with httpx.AsyncClient() as client:
                for fields in field_options:
                    resp = await client.get(
                        f"{api_url}/me/media",
                        params={
                            "access_token": self.account.access_token,
                            "fields": fields,
                            "limit": max_results,
                        },
                        timeout=4,
                    )
                    if resp.status_code == 200:
                        raw_items = resp.json().get("data", [])
                        for m in raw_items:
                            caption_text = m.get("caption") or f"Instagram {m.get('media_type', 'Post')}"
                            m_id = m.get("id", "")
                            media_type = m.get("media_type", "IMAGE")
                            views = int(m.get("play_count") or m.get("view_count") or 0)
                            likes_count = int(m.get("like_count", 0))
                            comments_count = int(m.get("comments_count", 0))

                            # Query insights ONLY for Meta Graph Business/Creator tokens (not Basic Display IGAG... tokens)
                            if views == 0 and media_type in ("VIDEO", "REELS") and not is_basic_token:
                                try:
                                    ins_resp = await client.get(
                                        f"https://graph.facebook.com/v19.0/{m_id}/insights",
                                        params={
                                            "access_token": self.account.access_token,
                                            "metric": "plays,reach",
                                        },
                                        timeout=5,
                                    )
                                    if ins_resp.status_code == 200:
                                        ins_data = ins_resp.json().get("data", [])
                                        for metric in ins_data:
                                            if metric.get("name") in ("plays", "reach", "video_views"):
                                                vals = metric.get("values", [])
                                                if vals and isinstance(vals[0], dict):
                                                    v_val = vals[0].get("value", 0)
                                                    if isinstance(v_val, int) and v_val > views:
                                                        views = v_val
                                except Exception:
                                    pass

                            items.append({
                                "id": m_id,
                                "title": caption_text,
                                "message": caption_text,
                                "thumbnail_url": m.get("thumbnail_url") or m.get("media_url") or "",
                                "permalink": m.get("permalink") or f"https://www.instagram.com/p/{m_id}",
                                "published_at": m.get("timestamp", ""),
                                "views": views,
                                "likes": likes_count,
                                "reactions": likes_count,
                                "comments": comments_count,
                                "shares": 0,
                            })
                        break
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
