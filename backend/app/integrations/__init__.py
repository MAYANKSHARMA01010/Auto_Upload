"""
Connector registry — maps Platform enum values to connector classes.
Add new platforms here without modifying any other code.
"""
from typing import Type

from app.integrations.base import BasePlatformConnector
from app.integrations.youtube import YouTubeService
from app.integrations.instagram import InstagramService
from app.integrations.facebook import FacebookService
from app.integrations.tiktok import TikTokService
from app.integrations.threads import ThreadsService
from app.integrations.x import XService
from app.models.scheduled_post import Platform

CONNECTOR_REGISTRY: dict[Platform, Type[BasePlatformConnector]] = {
    Platform.YOUTUBE: YouTubeService,
    Platform.INSTAGRAM: InstagramService,
    Platform.FACEBOOK: FacebookService,
    Platform.TIKTOK: TikTokService,
    Platform.THREADS: ThreadsService,
    Platform.X: XService,
}

OAUTH_URL_GENERATORS = {
    Platform.YOUTUBE: YouTubeService.get_oauth_url,
    Platform.INSTAGRAM: InstagramService.get_oauth_url,
    Platform.FACEBOOK: FacebookService.get_oauth_url,
    Platform.TIKTOK: TikTokService.get_oauth_url,
    Platform.THREADS: ThreadsService.get_oauth_url,
    Platform.X: XService.get_oauth_url,
}


def get_connector(platform: Platform, account) -> BasePlatformConnector:
    """Factory function to instantiate the correct connector for a platform."""
    cls = CONNECTOR_REGISTRY.get(platform)
    if not cls:
        raise ValueError(f"No connector registered for platform: {platform}")
    return cls(account)
