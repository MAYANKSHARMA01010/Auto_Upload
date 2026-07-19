"""
Abstract base class for all platform connectors.
Every connector must implement these methods.
New platforms can be added by creating a subclass — no existing code changes needed.
"""
from abc import ABC, abstractmethod
from typing import Any, Optional

from app.models.connected_account import ConnectedAccount
from app.models.scheduled_post import ScheduledPost


class BasePlatformConnector(ABC):
    """
    Contract that every platform connector must satisfy.

    Lifecycle:
      connect() → validate() → upload() → publish()
      [or]
      connect() → validate() → schedule()

    On failure:  get_status() → retry logic → error logging
    On cleanup:  delete()
    """

    def __init__(self, account: ConnectedAccount) -> None:
        self.account = account

    @abstractmethod
    async def connect(self) -> bool:
        """
        Establish / refresh the OAuth connection.
        Returns True if the account is connected and tokens are valid.
        """
        ...

    @abstractmethod
    async def validate(self) -> bool:
        """
        Validate that the account credentials are still valid and
        the platform API is reachable.
        Returns True on success.
        """
        ...

    @abstractmethod
    async def upload(self, post: ScheduledPost, video_bytes: bytes) -> str:
        """
        Upload the video file to the platform.
        Returns a platform-specific upload/video ID.
        """
        ...

    @abstractmethod
    async def publish(self, post: ScheduledPost, upload_id: str) -> str:
        """
        Publish (make public) the uploaded video.
        Returns the platform post URL or ID.
        """
        ...

    @abstractmethod
    async def schedule(self, post: ScheduledPost, video_bytes: bytes) -> str:
        """
        Upload and schedule the post for future publishing.
        Returns the platform-specific post ID.
        """
        ...

    @abstractmethod
    async def delete(self, platform_post_id: str) -> bool:
        """
        Delete a published or scheduled post from the platform.
        Returns True on success.
        """
        ...

    @abstractmethod
    async def get_status(self, platform_post_id: str) -> str:
        """
        Retrieve the current status of a post from the platform API.
        Returns a status string.
        """
        ...

    async def refresh_token(self) -> bool:
        """
        Refresh the OAuth access token using the refresh token.
        Override in subclasses that support token refresh.
        Returns True if refresh succeeded.
        """
        return False

    def _headers(self) -> dict[str, str]:
        """Return authorization headers for API requests."""
        return {"Authorization": f"Bearer {self.account.access_token}"}
