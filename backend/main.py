"""
ClipScheduler FastAPI Application Entry Point.
"""
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import settings
from app.database.session import close_db, init_db
from app.workers.scheduler import start_scheduler, stop_scheduler

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


from app.core.cache import cache_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown hooks."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    # Initialize cache service (Redis or Async In-Memory fallback)
    await cache_service.initialize(redis_url=settings.active_redis_url)

    # Initialize database tables (dev only — use Alembic for production)
    if settings.ENVIRONMENT == "development":
        try:
            await init_db()
        except Exception as e:
            logger.warning(f"Could not connect to database or initialize tables: {e}")
            logger.warning("Please ensure PostgreSQL is running or update DATABASE_URL in .env")

    # Start background scheduler
    start_scheduler()

    yield

    # Shutdown
    stop_scheduler()
    await cache_service.close()
    await close_db()
    logger.info(f"{settings.APP_NAME} shut down gracefully")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Social Media Video Scheduler — production-ready API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ── Security Headers Middleware (Helmet equivalent) ───────────────────────
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routes
app.include_router(api_router)

import os
from fastapi.staticfiles import StaticFiles

# Serve local uploads when R2 is not configured
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Serve shorts-factory local media (videos + covers) for the Studio ────────
SHORTS_FACTORY_DATA = "/Users/mayanksharma/Downloads/New_Projects/shorts-factory/packages/ClipPilot/data"
SHORTS_FACTORY_COVERS = "/Users/mayanksharma/Downloads/New_Projects/shorts-factory/packages/ClipPilot/data/covers"
SHORTS_FACTORY_ROOT_COVERS = "/Users/mayanksharma/Downloads/New_Projects/shorts-factory/data/covers"

if os.path.isdir(SHORTS_FACTORY_DATA):
    app.mount("/local-media/data", StaticFiles(directory=SHORTS_FACTORY_DATA), name="local-media-data")

from fastapi import HTTPException
from fastapi.responses import FileResponse

@app.get("/local-media/covers/{filename:path}", include_in_schema=False)
async def get_cover_file(filename: str):
    p1 = Path(SHORTS_FACTORY_COVERS) / filename
    if p1.is_file():
        return FileResponse(str(p1))
    p2 = Path(SHORTS_FACTORY_ROOT_COVERS) / filename
    if p2.is_file():
        return FileResponse(str(p2))
    p3 = Path(SHORTS_FACTORY_DATA) / filename
    if p3.is_file():
        return FileResponse(str(p3))
    raise HTTPException(status_code=404, detail="Cover image not found")

from fastapi.responses import RedirectResponse

@app.get("/", include_in_schema=False)
async def root():
    """Redirect root to API documentation."""
    return RedirectResponse(url="/docs")


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return JSONResponse(
        content={
            "status": "healthy",
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        }
    )
