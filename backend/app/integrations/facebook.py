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
        """Fetch Facebook Page & Profile published videos, reels, photos, and feed posts with resilient metrics (views, likes, comments)."""
        items = []
        seen_ids = set()
        seen_titles = set()
        target_ids = [self.account.platform_user_id, "me"] if self.account.platform_user_id else ["me"]

        def parse_counts(obj: dict) -> tuple[int, int, int]:
            v_cnt = int(obj.get("views", 0))
            r_cnt = 0
            reacts = obj.get("reactions")
            likes = obj.get("likes")
            if isinstance(reacts, dict):
                r_cnt = int(reacts.get("summary", {}).get("total_count", 0))
            elif isinstance(likes, dict):
                r_cnt = int(likes.get("summary", {}).get("total_count", 0))

            c_cnt = 0
            cmts = obj.get("comments")
            if isinstance(cmts, dict):
                c_cnt = int(cmts.get("summary", {}).get("total_count", 0))
            return v_cnt, r_cnt, c_cnt

        try:
            async with httpx.AsyncClient() as client:
                for tid in target_ids:
                    if not tid:
                        continue
                    token = await self._get_effective_token(client, tid)

                    # 1. Fetch Video Reels & Page Videos first
                    for video_ep in ["video_reels", "videos"]:
                        field_attempts = [
                            "id,title,description,picture,permalink_url,created_time,views,reactions.summary(true),comments.summary(true)",
                            "id,title,description,picture,permalink_url,created_time,views,comments.summary(true)",
                            "id,title,description,picture,permalink_url,created_time,views",
                            "id,title,description,picture,permalink_url,created_time",
                        ]
                        p_resp = None
                        for f_opts in field_attempts:
                            p_resp = await client.get(
                                f"{self.GRAPH_URL}/{tid}/{video_ep}",
                                params={
                                    "access_token": token,
                                    "fields": f_opts,
                                    "limit": max_results,
                                },
                                timeout=5,
                            )
                            if p_resp.status_code == 200:
                                break

                        if p_resp and p_resp.status_code == 200:
                            v_data = p_resp.json().get("data", [])
                            for v in v_data:
                                v_id = str(v.get("id", ""))
                                if not v_id or v_id in seen_ids:
                                    continue
                                title_text = v.get("title") or v.get("description") or f"Facebook Video ({v_id[-6:]})"
                                norm_title = title_text.strip().lower()
                                views_cnt, likes_cnt, cmts_cnt = parse_counts(v)

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
                                    "views": views_cnt,
                                    "likes": likes_cnt,
                                    "reactions": likes_cnt,
                                    "comments": cmts_cnt,
                                    "shares": 0,
                                })

                    # 2. ALWAYS Fetch Feed & Published Posts (Photos, Statuses, Links)
                    for endpoint in ["published_posts", "feed", "posts"]:
                        post_field_attempts = [
                            "id,message,description,created_time,full_picture,permalink_url,reactions.summary(true),comments.summary(true),shares",
                            "id,message,description,created_time,full_picture,permalink_url,reactions.summary(true)",
                            "id,message,created_time,full_picture,permalink_url",
                        ]
                        p_resp = None
                        for f_opts in post_field_attempts:
                            p_resp = await client.get(
                                f"{self.GRAPH_URL}/{tid}/{endpoint}",
                                params={
                                    "access_token": token,
                                    "fields": f_opts,
                                    "limit": max_results,
                                },
                                timeout=5,
                            )
                            if p_resp.status_code == 200:
                                break

                        if p_resp and p_resp.status_code == 200:
                            posts_data = p_resp.json().get("data", [])
                            for post in posts_data:
                                p_id = str(post.get("id", ""))
                                if not p_id or p_id in seen_ids:
                                    continue
                                title_text = post.get("message") or post.get("description") or f"Facebook Post ({p_id[-6:]})"
                                norm_title = title_text.strip().lower()

                                if norm_title and norm_title in seen_titles:
                                    continue

                                views_cnt, likes_cnt, cmts_cnt = parse_counts(post)
                                shares_dict = post.get("shares", {})
                                shares_cnt = shares_dict.get("count", 0) if isinstance(shares_dict, dict) else 0

                                seen_ids.add(p_id)
                                if norm_title:
                                    seen_titles.add(norm_title)

                # Enrich post impressions for items with views == 0 using effective page token
                for item in items:
                    if item.get("views", 0) == 0 and item.get("id"):
                        try:
                            item_tid = item["id"].split("_")[0] if "_" in item["id"] else (self.account.platform_user_id or "me")
                            e_token = await self._get_effective_token(client, item_tid)

                            # 1. Try video views field
                            i_resp = await client.get(
                                f"{self.GRAPH_URL}/{item['id']}",
                                params={"access_token": e_token, "fields": "views"},
                                timeout=3,
                            )
                            if i_resp.status_code == 200 and i_resp.json().get("views") is not None:
                                item["views"] = int(i_resp.json().get("views", 0))

                            # 2. Try post impressions insight if views is still 0
                            if item.get("views", 0) == 0:
                                i_resp = await client.get(
                                    f"{self.GRAPH_URL}/{item['id']}/insights",
                                    params={"access_token": e_token, "metric": "post_impressions,post_impressions_unique"},
                                    timeout=3,
                                )
                                if i_resp.status_code == 200:
                                    idata = i_resp.json().get("data", [])
                                    for m in idata:
                                        if m.get("name") in ("post_impressions", "post_impressions_unique"):
                                            vals = m.get("values", [])
                                            if vals and isinstance(vals[0], dict):
                                                val_num = vals[0].get("value", 0)
                                                if isinstance(val_num, int) and val_num > 0:
                                                    item["views"] = val_num
                                                    break
                        except Exception:
                            pass
        except Exception:
            pass
        return items

    async def get_status(self, platform_post_id: str) -> str:
        return "unknown"
