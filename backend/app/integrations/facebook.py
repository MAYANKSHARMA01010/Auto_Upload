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

    async def _get_effective_token(self, client: httpx.AsyncClient, target_id: str) -> str:
        """Fetch specific Page Access Token from /me/accounts if target_id is a Page ID, or fallback to account token."""
        user_token = self.account.access_token or ""
        if not user_token or not target_id or target_id == "me":
            return user_token

        try:
            resp = await client.get(
                f"{self.GRAPH_URL}/me/accounts",
                params={"access_token": user_token},
                timeout=5,
            )
            if resp.status_code == 200:
                pages = resp.json().get("data", [])
                for page in pages:
                    if str(page.get("id")) == str(target_id):
                        page_token = page.get("access_token")
                        if page_token:
                            return page_token
        except Exception:
            pass
        return user_token

    async def get_page_analytics(self) -> dict:
        """Fetch Facebook Page/User profile analytics (followers, picture, title)."""
        return await self.get_account_analytics()

    async def get_account_analytics(self) -> dict:
        """Fetch Facebook Page details, avatar, and Page Likes using standard Graph API fields."""
        target_ids = [self.account.platform_user_id, "me"] if self.account.platform_user_id else ["me"]

        field_options = [
            "id,name,picture.type(large),fan_count,followers_count",
            "id,name,picture.type(large),fan_count",
            "id,name,picture",
            "id,name",
        ]
        try:
            async with httpx.AsyncClient() as client:
                for tid in target_ids:
                    if not tid:
                        continue
                    token = await self._get_effective_token(client, tid)
                    for fields in field_options:
                        resp = await client.get(
                            f"{self.GRAPH_URL}/{tid}",
                            params={"access_token": token, "fields": fields},
                            timeout=5,
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            pic_url = data.get("picture", {}).get("data", {}).get("url", "")
                            followers_num = int(data.get("fan_count") or data.get("followers_count") or 0)
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
        """Fetch Facebook Page & Profile published videos, reels, photos, and feed posts with views, likes, comments."""
        items = []
        seen_ids = set()
        seen_titles = set()
        target_ids = [self.account.platform_user_id, "me"] if self.account.platform_user_id else ["me"]

        try:
            async with httpx.AsyncClient() as client:
                for tid in target_ids:
                    if not tid:
                        continue
                    token = await self._get_effective_token(client, tid)

                    # 1. Fetch Video Reels & Page Videos first
                    for video_ep in ["video_reels", "videos"]:
                        p_resp = await client.get(
                            f"{self.GRAPH_URL}/{tid}/{video_ep}",
                            params={
                                "access_token": token,
                                "fields": "id,title,description,picture,permalink_url,created_time,views,reactions.summary(true),comments.summary(true)",
                                "limit": max_results,
                            },
                            timeout=5,
                        )
                        if p_resp.status_code == 400:
                            p_resp = await client.get(
                                f"{self.GRAPH_URL}/{tid}/{video_ep}",
                                params={
                                    "access_token": token,
                                    "fields": "id,title,description,picture,permalink_url,created_time,views",
                                    "limit": max_results,
                                },
                                timeout=5,
                            )
                        if p_resp.status_code == 200:
                            v_data = p_resp.json().get("data", [])
                            for v in v_data:
                                v_id = str(v.get("id", ""))
                                if not v_id or v_id in seen_ids:
                                    continue
                                title_text = v.get("title") or v.get("description") or f"Facebook Video ({v_id[-6:]})"
                                norm_title = title_text.strip().lower()

                                reactions_dict = v.get("reactions", {})
                                reactions_count = reactions_dict.get("summary", {}).get("total_count", 0) if isinstance(reactions_dict, dict) else 0
                                likes_dict = v.get("likes", {})
                                likes_count = likes_dict.get("summary", {}).get("total_count", 0) if isinstance(likes_dict, dict) else reactions_count

                                comments_dict = v.get("comments", {})
                                comments_count = comments_dict.get("summary", {}).get("total_count", 0) if isinstance(comments_dict, dict) else 0
                                views_count = int(v.get("views", 0))

                                seen_ids.add(v_id)
                                if norm_title:
                                    seen_titles.add(norm_title)

                                items.append({
                                    "id": v_id,
                                    "title": title_text,
                                    "message": title_text,
                                    "thumbnail_url": v.get("picture", ""),
                                    "permalink": v.get("permalink_url") or f"https://www.facebook.com/{v_id}",
                                    "published_at": v.get("created_time", ""),
                                    "views": views_count,
                                    "likes": int(likes_count or reactions_count),
                                    "reactions": int(reactions_count or likes_count),
                                    "comments": int(comments_count),
                                    "shares": 0,
                                })

                    # 2. ALWAYS Fetch Feed & Published Posts (Photos, Statuses, Links)
                    for endpoint in ["published_posts", "feed", "posts"]:
                        p_resp = await client.get(
                            f"{self.GRAPH_URL}/{tid}/{endpoint}",
                            params={
                                "access_token": token,
                                "fields": "id,message,description,created_time,full_picture,permalink_url,reactions.summary(true),comments.summary(true),shares",
                                "limit": max_results,
                            },
                            timeout=5,
                        )
                        if p_resp.status_code == 400:
                            p_resp = await client.get(
                                f"{self.GRAPH_URL}/{tid}/{endpoint}",
                                params={
                                    "access_token": token,
                                    "fields": "id,message,created_time,full_picture,permalink_url",
                                    "limit": max_results,
                                },
                                timeout=5,
                            )
                        if p_resp.status_code == 200:
                            posts_data = p_resp.json().get("data", [])
                            for post in posts_data:
                                p_id = str(post.get("id", ""))
                                if not p_id or p_id in seen_ids:
                                    continue
                                title_text = post.get("message") or post.get("description") or f"Facebook Post ({p_id[-6:]})"
                                norm_title = title_text.strip().lower()

                                if norm_title and norm_title in seen_titles:
                                    continue

                                reactions_dict = post.get("reactions", {})
                                reactions_count = reactions_dict.get("summary", {}).get("total_count", 0) if isinstance(reactions_dict, dict) else 0
                                likes_dict = post.get("likes", {})
                                likes_count = likes_dict.get("summary", {}).get("total_count", 0) if isinstance(likes_dict, dict) else reactions_count

                                comments_dict = post.get("comments", {})
                                comments_count = comments_dict.get("summary", {}).get("total_count", 0) if isinstance(comments_dict, dict) else 0
                                shares_count = post.get("shares", {}).get("count", 0) if isinstance(post.get("shares"), dict) else 0

                                seen_ids.add(p_id)
                                if norm_title:
                                    seen_titles.add(norm_title)

                                items.append({
                                    "id": p_id,
                                    "title": title_text,
                                    "message": title_text,
                                    "thumbnail_url": post.get("full_picture", ""),
                                    "permalink": post.get("permalink_url") or f"https://www.facebook.com/{p_id}",
                                    "published_at": post.get("created_time", ""),
                                    "views": 0,
                                    "likes": int(likes_count or reactions_count),
                                    "reactions": int(reactions_count or likes_count),
                                    "comments": int(comments_count),
                                    "shares": int(shares_count),
                                })
                            if posts_data:
                                break
        except Exception:
            pass
        return items

    async def get_status(self, platform_post_id: str) -> str:
        return "unknown"
