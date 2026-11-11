from contextlib import asynccontextmanager
from datetime import datetime, timezone
import logging
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.redis import redis_manager
from app.database.session import engine, Base, get_db
import app.models  # Ensure all SQLAlchemy models are registered
from app.api.v1.router import api_router
from app.services.url_service import resolve_short_url
from app.services.analytics_service import record_click

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s"
)
logger = logging.getLogger("linkflow")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema verified.")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="High-performance, scalable URL Shortener platform inspired by Bitly. Built with FastAPI, PostgreSQL, Redis, and Next.js.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["General"])
def read_root():
    """API Root information."""
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "redoc": "/redoc",
        "status": "online"
    }


@app.get("/health", tags=["General"])
def health_check(db: Session = Depends(get_db)):
    """System health check verifying database and Redis connectivity."""
    db_status = "healthy"
    try:
        db.execute(Base.metadata.tables["users"].select().limit(1))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "redis": "connected" if redis_manager.is_available else "disconnected (fallback active)",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/r/{short_code}", tags=["Redirection"], summary="Resolve short link and redirect")
def redirect_short_url(
    short_code: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    High-performance URL Redirection:
    1. Look up short_code in Redis cache.
    2. Fallback to PostgreSQL on cache miss.
    3. Update Redis cache with destination details.
    4. Validate active status and expiration.
    5. Record analytics (click count, daily stats, metadata).
    6. Return HTTP 301 or 302 Redirect to destination URL.
    """
    url_data, source = resolve_short_url(db=db, short_code=short_code)

    if not url_data or source == "none":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"The short link '{short_code}' was not found. Please verify the URL."
        )

    # Check if disabled
    if not url_data.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This short link has been disabled by its owner."
        )

    # Check expiration date
    expires_at_str = url_data.get("expires_at")
    if expires_at_str:
        try:
            expires_at = datetime.fromisoformat(expires_at_str)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at <= datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_410_GONE,
                    detail="This short link has expired."
                )
        except ValueError:
            pass

    # Record click asynchronously / directly
    url_id = url_data.get("id")
    if url_id:
        record_click(db=db, url_id=url_id, request=request)

    target_url = url_data["original_url"]
    redirect_code = url_data.get("redirect_type", 302)

    response = RedirectResponse(url=target_url, status_code=redirect_code)
    # Add custom diagnostic header indicating cache status
    response.headers["X-LinkFlow-Cache"] = "HIT" if source == "cache" else "MISS"
    return response
