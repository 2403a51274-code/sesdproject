from datetime import datetime, timezone
import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.url import URL
from app.schemas.url import (
    URLCreate,
    PublicURLCreate,
    URLUpdate,
    URLResponse,
    URLListResponse
)
from app.schemas.auth import MessageResponse
from app.api.deps import get_current_user, get_optional_user
from app.services.url_service import (
    create_short_url,
    build_short_url,
    delete_user_url,
    get_user_urls_paginated
)
from app.core.redis import redis_manager

router = APIRouter()


def format_url_response(url_obj: URL) -> URLResponse:
    now = datetime.now(timezone.utc)
    is_expired = False
    if url_obj.expires_at:
        exp = url_obj.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        is_expired = exp <= now

    return URLResponse(
        id=url_obj.id,
        user_id=url_obj.user_id,
        original_url=url_obj.original_url,
        short_code=url_obj.short_code,
        short_url=build_short_url(url_obj.short_code),
        click_count=url_obj.click_count,
        redirect_type=url_obj.redirect_type,
        created_at=url_obj.created_at,
        expires_at=url_obj.expires_at,
        is_active=url_obj.is_active,
        is_expired=is_expired
    )


@router.post("", response_model=URLResponse, status_code=status.HTTP_201_CREATED)
def create_url(
    payload: URLCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new shortened URL for the authenticated user.
    Supports custom aliases, expiration datetime, and HTTP 301/302 redirect configuration.
    """
    url_obj = create_short_url(
        db=db,
        original_url=payload.original_url,
        user_id=current_user.id,
        custom_alias=payload.custom_alias,
        redirect_type=payload.redirect_type,
        expires_at=payload.expires_at
    )
    return format_url_response(url_obj)


@router.post("/public", response_model=URLResponse, status_code=status.HTTP_201_CREATED)
def create_public_url(
    payload: PublicURLCreate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Public URL shortening endpoint for visitors on the landing page hero section.
    If the visitor is already logged in, the link is automatically associated with their account.
    """
    user_id = current_user.id if current_user else None
    url_obj = create_short_url(
        db=db,
        original_url=payload.original_url,
        user_id=user_id,
        redirect_type=302
    )
    return format_url_response(url_obj)


@router.get("", response_model=URLListResponse)
def list_user_urls(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term for destination or short code"),
    sort_by: str = Query("created_at", pattern="^(created_at|clicks|short_code)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    status: Optional[str] = Query(None, pattern="^(active|inactive|expired)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List links belonging exclusively to the authenticated user with search, filtering, and pagination.
    """
    items, total = get_user_urls_paginated(
        db=db,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        status_filter=status
    )

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return URLListResponse(
        items=[format_url_response(u) for u in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{url_id}", response_model=URLResponse)
def get_single_url(
    url_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve details for a single URL owned by the authenticated user."""
    url_obj = db.query(URL).filter(URL.id == url_id, URL.user_id == current_user.id).first()
    if not url_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL not found or you do not have permission to access it."
        )
    return format_url_response(url_obj)


@router.patch("/{url_id}", response_model=URLResponse)
def update_url(
    url_id: int,
    payload: URLUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update settings (active status, expiration date, redirect code) for a user-owned link."""
    url_obj = db.query(URL).filter(URL.id == url_id, URL.user_id == current_user.id).first()
    if not url_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL not found or you do not have permission to edit it."
        )

    if payload.is_active is not None:
        url_obj.is_active = payload.is_active
    if payload.expires_at is not None:
        url_obj.expires_at = payload.expires_at
    if payload.redirect_type is not None:
        if payload.redirect_type not in (301, 302):
            raise HTTPException(status_code=400, detail="Redirect type must be 301 or 302.")
        url_obj.redirect_type = payload.redirect_type

    db.commit()
    db.refresh(url_obj)

    # Invalidate Redis cache entry
    redis_manager.delete_url(url_obj.short_code)

    return format_url_response(url_obj)


@router.delete("/{url_id}", response_model=MessageResponse)
def delete_url(
    url_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a user-owned shortened URL and immediately purge its cache."""
    delete_user_url(db=db, url_id=url_id, user_id=current_user.id)
    return MessageResponse(message="URL successfully deleted.", success=True)
