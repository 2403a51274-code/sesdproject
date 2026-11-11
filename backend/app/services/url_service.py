from datetime import datetime, timezone
import logging
from typing import Optional, Tuple, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import desc, asc, or_
from fastapi import HTTPException, status

from app.models.url import URL
from app.models.analytics import DailyClickStats, ClickEvent
from app.services.shortcode import generate_base62_code
from app.core.redis import redis_manager
from app.core.config import settings

logger = logging.getLogger(__name__)


def build_short_url(short_code: str) -> str:
    """Format full short URL using configured backend or frontend domain."""
    return f"{settings.BACKEND_URL}/r/{short_code}"


def create_short_url(
    db: Session,
    original_url: str,
    user_id: Optional[int] = None,
    custom_alias: Optional[str] = None,
    redirect_type: int = 302,
    expires_at: Optional[datetime] = None,
) -> URL:
    """
    Create a new short link with Base62 generation and bounded collision resolution.
    Strictly enforces DB-level uniqueness constraint on short_code.
    """
    # 1. Custom Alias Handling
    if custom_alias:
        # Check collision for custom alias
        existing = db.query(URL).filter(URL.short_code == custom_alias).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"The alias '{custom_alias}' is already in use. Please choose another."
            )
        
        url_obj = URL(
            original_url=original_url,
            short_code=custom_alias,
            user_id=user_id,
            redirect_type=redirect_type,
            expires_at=expires_at,
            is_active=True,
            click_count=0
        )
        try:
            db.add(url_obj)
            db.commit()
            db.refresh(url_obj)
            return url_obj
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"The alias '{custom_alias}' was claimed concurrently. Please try another."
            )

    # 2. Automated Base62 Generation with Bounded Retry Collision Resolution
    retries = 0
    max_retries = settings.MAX_COLLISION_RETRIES

    while retries < max_retries:
        candidate_code = generate_base62_code(settings.SHORT_CODE_LENGTH)
        try:
            # Use savepoint so collision rollback does not affect prior transaction state
            with db.begin_nested():
                url_obj = URL(
                    original_url=original_url,
                    short_code=candidate_code,
                    user_id=user_id,
                    redirect_type=redirect_type,
                    expires_at=expires_at,
                    is_active=True,
                    click_count=0
                )
                db.add(url_obj)
                db.flush()
            db.commit()
            db.refresh(url_obj)
            return url_obj
        except IntegrityError:
            retries += 1
            logger.warning(
                "Short-code collision detected on candidate '%s'. Retrying attempt %d/%d...",
                candidate_code,
                retries,
                max_retries
            )

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to generate a unique short code after multiple attempts. Please try again."
    )


def resolve_short_url(
    db: Session,
    short_code: str
) -> Tuple[Optional[Dict[str, Any]], str]:
    """
    Resolve short code to target destination using Cache-Aside pattern.
    Step 1: Check Redis cache.
    Step 2: If miss, query PostgreSQL database.
    Step 3: If found in DB, populate Redis cache.
    Returns (url_data_dict, source) where source is 'cache' or 'db'.
    """
    # 1. Check Redis Cache
    cached = redis_manager.get_url(short_code)
    if cached:
        return cached, "cache"

    # 2. Query Database (PostgreSQL / SQLite)
    url_obj = db.query(URL).filter(URL.short_code == short_code).first()
    if not url_obj:
        return None, "none"

    data = {
        "id": url_obj.id,
        "original_url": url_obj.original_url,
        "redirect_type": url_obj.redirect_type,
        "is_active": url_obj.is_active,
        "expires_at": url_obj.expires_at.isoformat() if url_obj.expires_at else None,
        "user_id": url_obj.user_id,
    }

    # 3. Populate Redis Cache for subsequent requests
    redis_manager.set_url(short_code, data)
    return data, "db"


def delete_user_url(db: Session, url_id: int, user_id: int) -> bool:
    """Delete a user-owned URL and purge its Redis cache."""
    url_obj = db.query(URL).filter(URL.id == url_id, URL.user_id == user_id).first()
    if not url_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL not found or you do not have permission to delete it."
        )

    short_code = url_obj.short_code
    db.delete(url_obj)
    db.commit()

    # Invalidate Redis cache
    redis_manager.delete_url(short_code)
    return True


def get_user_urls_paginated(
    db: Session,
    user_id: int,
    page: int = 1,
    page_size: int = 10,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    status_filter: Optional[str] = None
) -> Tuple[List[URL], int]:
    """Fetch paginated, filtered, and sorted links belonging exclusively to the user."""
    query = db.query(URL).filter(URL.user_id == user_id)

    # Search filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(URL.original_url.ilike(term), URL.short_code.ilike(term)))

    # Status filter
    now = datetime.now(timezone.utc)
    if status_filter == "active":
        query = query.filter(URL.is_active.is_(True), or_(URL.expires_at.is_(None), URL.expires_at > now))
    elif status_filter == "inactive":
        query = query.filter(URL.is_active.is_(False))
    elif status_filter == "expired":
        query = query.filter(URL.expires_at.isnot(None), URL.expires_at <= now)

    total = query.count()

    # Sorting
    sort_col = URL.created_at
    if sort_by == "clicks":
        sort_col = URL.click_count
    elif sort_by == "short_code":
        sort_col = URL.short_code

    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()
    return items, total
