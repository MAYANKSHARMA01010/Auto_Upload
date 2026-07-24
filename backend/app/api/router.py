"""
API router — assembles all route modules under /api/v1 prefix.
"""
from fastapi import APIRouter

from app.api import auth, videos, schedules, accounts, calendar, analytics, settings, logs, manifests, ai

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(videos.router)
api_router.include_router(schedules.router)
api_router.include_router(accounts.router)
api_router.include_router(calendar.router)
api_router.include_router(analytics.router)
api_router.include_router(settings.router)
api_router.include_router(logs.router)
api_router.include_router(manifests.router)
api_router.include_router(ai.router)
