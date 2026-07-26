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
