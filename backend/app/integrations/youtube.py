"""
YouTube connector — implements BasePlatformConnector for YouTube Data API v3.
Publishes both YouTube Shorts (< 60s vertical) and Long-form videos.
"""
import httpx

from app.integrations.base import BasePlatformConnector
from app.models.connected_account import ConnectedAccount
from app.models.scheduled_post import ScheduledPost
from app.core.config import settings


class YouTubeService(BasePlatformConnector):
    """YouTube connector supporting both Shorts and Long-Form Video uploads."""

    UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos"
    API_BASE = "https://www.googleapis.com/youtube/v3"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"

    def __init__(self, account: ConnectedAccount) -> None:
        super().__init__(account)

    @classmethod
    def get_oauth_url(cls, state: str) -> str:
        """Generate OAuth authorization URL."""
        import urllib.parse
        params = {
            "client_id": settings.YOUTUBE_CLIENT_ID,
            "redirect_uri": settings.YOUTUBE_REDIRECT_URI,
            "response_type": "code",
            "scope": "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }
        return f"{cls.AUTH_URL}?{urllib.parse.urlencode(params)}"

    async def connect(self) -> bool:
        """Validate token or attempt refresh."""
        if self.account.access_token:
            return await self.validate()
        return False

    async def validate(self) -> bool:
        """Check that the token is valid by hitting the channels endpoint."""
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.API_BASE}/channels",
                    headers=self._headers(),
                    params={"part": "id", "mine": "true"},
                    timeout=10,
                )
                return resp.status_code == 200
        except Exception:
            return False

    async def refresh_token(self) -> bool:
        """Refresh OAuth token using refresh_token grant."""
        if not self.account.refresh_token:
            return False
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    self.TOKEN_URL,
                    data={
                        "client_id": settings.YOUTUBE_CLIENT_ID,
                        "client_secret": settings.YOUTUBE_CLIENT_SECRET,
                        "refresh_token": self.account.refresh_token,
                        "grant_type": "refresh_token",
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    self.account.access_token = data["access_token"]
                    return True
        except Exception:
            pass
        return False

    async def upload(self, post: ScheduledPost, video_bytes: bytes) -> str:
        """
        Upload video using resumable upload to YouTube.
        Returns the YouTube video ID.
        """
        # Build video resource
        video_resource = {
            "snippet": {
                "title": post.title or "Untitled",
                "description": post.description or "",
                "tags": [t.strip() for t in (post.tags or "").split(",") if t.strip()],
                "categoryId": post.category or "22",  # People & Blogs default
                "defaultLanguage": post.language or "en",
                "defaultAudioLanguage": post.language or "en",
            },
            "status": {
                "privacyStatus": post.visibility or "public",
                "selfDeclaredMadeForKids": post.made_for_kids or False,
                "license": post.license or "youtube",
                "embeddable": post.allow_embedding if post.allow_embedding is not None else True,
                "publicStatsViewable": True,
            },
        }

        # NOTE: Real resumable upload implementation would be here.
        # This stub returns a placeholder ID until real credentials are provided.
        # Full implementation: https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol
        raise NotImplementedError(
            "YouTube upload requires real OAuth credentials. "
            "Configure YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in .env"
        )

    async def publish(self, post: ScheduledPost, upload_id: str) -> str:
        """Make an uploaded video public."""
        # For YouTube, visibility is set during upload.
        return upload_id

    async def schedule(self, post: ScheduledPost, video_bytes: bytes) -> str:
        """Upload and mark video as scheduled for future publish."""
        return await self.upload(post, video_bytes)

    async def delete(self, platform_post_id: str) -> bool:
        """Delete a video from YouTube."""
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.delete(
                    f"{self.API_BASE}/videos",
                    headers=self._headers(),
                    params={"id": platform_post_id},
                )
                return resp.status_code == 204
        except Exception:
            return False

    async def get_status(self, platform_post_id: str) -> str:
        """Get the processing status of a YouTube video."""
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.API_BASE}/videos",
                    headers=self._headers(),
                    params={"part": "status", "id": platform_post_id},
                )
                if resp.status_code == 200:
                    items = resp.json().get("items", [])
                    if items:
                        return items[0]["status"]["uploadStatus"]
        except Exception:
            pass
        return "unknown"

    async def get_channel_analytics(self) -> dict:
        """Fetch YouTube channel snippet and statistics (subscribers, views, video count). Auto-refreshes token if expired."""
        try:
            async with httpx.AsyncClient() as client:
                params = {"part": "snippet,statistics,contentDetails"}
                if self.account.platform_user_id and str(self.account.platform_user_id).startswith("UC"):
                    params["id"] = self.account.platform_user_id
                else:
                    params["mine"] = "true"

                resp = await client.get(
                    f"{self.API_BASE}/channels",
                    headers=self._headers(),
                    params=params,
                    timeout=10,
                )
                if resp.status_code == 401:
                    # Token expired, attempt refresh
                    if await self.refresh_token():
                        resp = await client.get(
                            f"{self.API_BASE}/channels",
                            headers=self._headers(),
                            params=params,
                            timeout=10,
                        )

                # Fallback to mine=true if specific ID query returned no items
                if resp.status_code == 200 and not resp.json().get("items"):
                    resp = await client.get(
                        f"{self.API_BASE}/channels",
                        headers=self._headers(),
                        params={"part": "snippet,statistics,contentDetails", "mine": "true"},
                        timeout=10,
                    )
                if resp.status_code == 200:
                    items = resp.json().get("data", []) if "data" in resp.json() else resp.json().get("items", [])
                    if items:
                        # Select best channel (Brand channel with subscribers/views/videos over empty personal profile)
                        best_item = items[0]
                        best_score = -1
                        for it in items:
                            st = it.get("statistics", {})
                            subs = int(st.get("subscriberCount", 0))
                            views = int(st.get("viewCount", 0))
                            vids = int(st.get("videoCount", 0))
                            score = subs * 10000 + views + vids * 10
                            if score > best_score:
                                best_score = score
                                best_item = it

                        snippet = best_item.get("snippet", {})
                        stats = best_item.get("statistics", {})
                        uploads_playlist = best_item.get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads", "")
                        return {
                            "channel_id": best_item.get("id", ""),
                            "title": snippet.get("title", self.account.username or "YouTube Channel"),
                            "custom_url": snippet.get("customUrl", ""),
                            "avatar_url": snippet.get("thumbnails", {}).get("default", {}).get("url", ""),
                            "subscribers": int(stats.get("subscriberCount", 0)),
                            "total_views": int(stats.get("viewCount", 0)),
                            "video_count": int(stats.get("videoCount", 0)),
                            "uploads_playlist": uploads_playlist,
                        }
        except Exception:
            pass
        return {
            "channel_id": self.account.platform_user_id or "",
            "title": self.account.username or "YouTube Channel",
            "custom_url": "",
            "avatar_url": "",
            "subscribers": 0,
            "total_views": 0,
            "video_count": 0,
            "uploads_playlist": "",
        }

    async def get_video_analytics(self, uploads_playlist: str = "", max_results: int = 25) -> list[dict]:
        """Fetch channel's uploaded videos and their view/like/comment performance metrics."""
        videos = []
        try:
            async with httpx.AsyncClient() as client:
                video_ids = []
                # Step 1: Query playlist items or search for channel's videos
                if uploads_playlist:
                    pl_resp = await client.get(
                        f"{self.API_BASE}/playlistItems",
                        headers=self._headers(),
                        params={"part": "contentDetails", "playlistId": uploads_playlist, "maxResults": max_results},
                        timeout=10,
                    )
                    if pl_resp.status_code == 401 and await self.refresh_token():
                        pl_resp = await client.get(
                            f"{self.API_BASE}/playlistItems",
                            headers=self._headers(),
                            params={"part": "contentDetails", "playlistId": uploads_playlist, "maxResults": max_results},
                            timeout=10,
                        )
                    if pl_resp.status_code == 200:
                        for item in pl_resp.json().get("items", []):
                            vid = item.get("contentDetails", {}).get("videoId")
                            if vid:
                                video_ids.append(vid)

                if not video_ids:
                    s_resp = await client.get(
                        f"{self.API_BASE}/search",
                        headers=self._headers(),
                        params={"part": "id", "forMine": "true", "type": "video", "maxResults": max_results},
                        timeout=10,
                    )
                    if s_resp.status_code == 401 and await self.refresh_token():
                        s_resp = await client.get(
                            f"{self.API_BASE}/search",
                            headers=self._headers(),
                            params={"part": "id", "forMine": "true", "type": "video", "maxResults": max_results},
                            timeout=10,
                        )
                    if s_resp.status_code == 200:
                        for item in s_resp.json().get("items", []):
                            vid = item.get("id", {}).get("videoId")
                            if vid:
                                video_ids.append(vid)

                if video_ids:
                    v_resp = await client.get(
                        f"{self.API_BASE}/videos",
                        headers=self._headers(),
                        params={"part": "snippet,statistics,contentDetails", "id": ",".join(video_ids[:50])},
                        timeout=10,
                    )
                    if v_resp.status_code == 401 and await self.refresh_token():
                        v_resp = await client.get(
                            f"{self.API_BASE}/videos",
                            headers=self._headers(),
                            params={"part": "snippet,statistics,contentDetails", "id": ",".join(video_ids[:50])},
                            timeout=10,
                        )
                    if v_resp.status_code == 200:
                        for item in v_resp.json().get("items", []):
                            snippet = item.get("snippet", {})
                            stats = item.get("statistics", {})
                            v_id = item.get("id", "")
                            videos.append({
                                "id": v_id,
                                "title": snippet.get("title", "Untitled Video"),
                                "description": snippet.get("description", ""),
                                "thumbnail_url": snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
                                "published_at": snippet.get("publishedAt", ""),
                                "views": int(stats.get("viewCount", 0)),
                                "likes": int(stats.get("likeCount", 0)),
                                "comments": int(stats.get("commentCount", 0)),
                                "permalink": f"https://www.youtube.com/watch?v={v_id}",
                            })
        except Exception:
            pass
        return videos
