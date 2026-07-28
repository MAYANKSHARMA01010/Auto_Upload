"""
Facebook Reels connector — uses Meta Graph API.
"""
import httpx

from app.integrations.base import BasePlatformConnector
from app.models.connected_account import ConnectedAccount
from app.models.scheduled_post import ScheduledPost
from app.core.config import settings


class FacebookService(BasePlatformConnector):
    """Facebook Reels connector via Meta Graph API."""

    GRAPH_URL = "https://graph.facebook.com/v19.0"
    AUTH_URL = "https://www.facebook.com/v19.0/dialog/oauth"
    TOKEN_URL = "https://graph.facebook.com/v19.0/oauth/access_token"

    @classmethod
    def get_oauth_url(cls, state: str) -> str:
        import urllib.parse
        params = {
            "client_id": settings.FACEBOOK_APP_ID,
            "redirect_uri": settings.FACEBOOK_REDIRECT_URI,
            "scope": "public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,pages_read_user_content,read_insights",
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
                    params={"access_token": self.account.access_token},
                    timeout=10,
                )
                return resp.status_code == 200
        except Exception:
            return False

    async def upload(self, post: ScheduledPost, video_bytes: bytes) -> str:
        raise NotImplementedError("Configure FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.")

    async def publish(self, post: ScheduledPost, upload_id: str) -> str:
        raise NotImplementedError("Configure FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.")

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

    async def get_page_analytics(self) -> dict:
        """Fetch Facebook Page/User profile analytics (followers, picture, title)."""
        target_ids = [self.account.platform_user_id, "me"] if self.account.platform_user_id else ["me"]
        field_options = [
            "id,name,picture,followers_count,fan_count,username,category",
            "id,name,picture,followers_count",
            "id,name,picture,email",
        ]
        try:
            async with httpx.AsyncClient() as client:
                for tid in target_ids:
                    if not tid:
                        continue
                    for fields in field_options:
                        resp = await client.get(
                            f"{self.GRAPH_URL}/{tid}",
                            params={"access_token": self.account.access_token, "fields": fields},
                            timeout=10,
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            pic_url = data.get("picture", {}).get("data", {}).get("url", "")
                            followers_num = int(data.get("followers_count") or data.get("fan_count") or 1)
                            return {
                                "page_id": data.get("id", ""),
                                "name": data.get("name", self.account.username or "Facebook Account"),
                                "username": data.get("username", self.account.username or ""),
                                "picture_url": pic_url,
                                "page_likes": followers_num,
                                "followers": followers_num,
                            }
        except Exception:
            pass
        return {
            "page_id": self.account.platform_user_id or "",
            "name": self.account.username or "Facebook Account",
            "username": self.account.username or "",
            "picture_url": "",
            "page_likes": 0,
            "followers": 0,
        }

    async def get_post_analytics(self, max_results: int = 25) -> list[dict]:
        """Fetch Facebook Page & User/Pro profile published videos, reels, and posts with resilient field fallbacks."""
        items = []
        seen_ids = set()
        target_ids = [self.account.platform_user_id, "me"] if self.account.platform_user_id else ["me"]

        try:
            async with httpx.AsyncClient() as client:
                # 1. Fetch Video Reels & Page Videos first
                for tid in target_ids:
                    if not tid:
                        continue
                    for video_ep in ["video_reels", "videos"]:
                        for fields in [
                            "id,title,description,picture,permalink_url,created_time,views,likes.summary(true),comments.summary(true)",
                            "id,title,description,picture,permalink_url,created_time,views",
                            "id,title,description,picture,permalink_url,created_time",
                        ]:
                            v_resp = await client.get(
                                f"{self.GRAPH_URL}/{tid}/{video_ep}",
                                params={"access_token": self.account.access_token, "fields": fields, "limit": max_results},
                                timeout=10,
                            )
                            if v_resp.status_code == 200:
                                v_data = v_resp.json().get("data", [])
                                for v in v_data:
                                    v_id = str(v.get("id", ""))
                                    if not v_id or v_id in seen_ids:
                                        continue
                                    seen_ids.add(v_id)
                                    title_text = v.get("title") or v.get("description") or f"Facebook Video ({v_id[-6:]})"
                                    likes_count = v.get("likes", {}).get("summary", {}).get("total_count", 0) if isinstance(v.get("likes"), dict) else 0
                                    comments_count = v.get("comments", {}).get("summary", {}).get("total_count", 0) if isinstance(v.get("comments"), dict) else 0
                                    views_count = int(v.get("views", 0))

                                    items.append({
                                        "id": v_id,
                                        "title": title_text,
                                        "message": title_text,
                                        "thumbnail_url": v.get("picture", ""),
                                        "permalink": v.get("permalink_url") or f"https://www.facebook.com/{v_id}",
                                        "published_at": v.get("created_time", ""),
                                        "views": views_count,
                                        "likes": int(likes_count),
                                        "reactions": int(likes_count),
                                        "comments": int(comments_count),
                                        "shares": 0,
                                    })
                                if v_data:
                                    break

                # 2. Fetch Feed, Posts & Published Posts
                for tid in target_ids:
                    if not tid:
                        continue
                    for endpoint in ["feed", "posts", "published_posts"]:
                        for fields in [
                            "id,message,description,story,created_time,full_picture,permalink_url,likes.summary(true),comments.summary(true),shares",
                            "id,message,description,story,created_time,full_picture,permalink_url",
                        ]:
                            p_resp = await client.get(
                                f"{self.GRAPH_URL}/{tid}/{endpoint}",
                                params={"access_token": self.account.access_token, "fields": fields, "limit": max_results},
                                timeout=10,
                            )
                            if p_resp.status_code == 200:
                                posts_data = p_resp.json().get("data", [])
                                if posts_data:
                                    for post in posts_data:
                                        p_id = str(post.get("id", ""))
                                        if not p_id or p_id in seen_ids:
                                            continue
                                        seen_ids.add(p_id)
                                        title_text = post.get("message") or post.get("description") or post.get("story") or f"Facebook Post ({p_id[-6:]})"
                                        likes_count = post.get("likes", {}).get("summary", {}).get("total_count", 0) if isinstance(post.get("likes"), dict) else 0
                                        comments_count = post.get("comments", {}).get("summary", {}).get("total_count", 0) if isinstance(post.get("comments"), dict) else 0
                                        shares_count = post.get("shares", {}).get("count", 0) if isinstance(post.get("shares"), dict) else 0
                                        items.append({
                                            "id": p_id,
                                            "title": title_text,
                                            "message": title_text,
                                            "thumbnail_url": post.get("full_picture", ""),
                                            "permalink": post.get("permalink_url") or f"https://www.facebook.com/{p_id}",
                                            "published_at": post.get("created_time", ""),
                                            "views": 0,
                                            "likes": int(likes_count),
                                            "reactions": int(likes_count),
                                            "comments": int(comments_count),
                                            "shares": int(shares_count),
                                        })
                                    break
                        if items:
                            break
        except Exception:
            pass
        return items

    async def get_status(self, platform_post_id: str) -> str:
        return "unknown"
