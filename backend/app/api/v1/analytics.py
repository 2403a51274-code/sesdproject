from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.models.user import User
from app.models.url import URL
from app.models.analytics import DailyClickStats, ClickEvent
from app.schemas.analytics import (
    URLAnalyticsResponse,
    OverviewAnalyticsResponse,
    DailyStatItem,
    RecentClickItem
)
from app.api.deps import get_current_user
from app.services.analytics_service import get_user_overview_analytics
from app.services.url_service import build_short_url

router = APIRouter()


@router.get("/overview", response_model=OverviewAnalyticsResponse)
def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve aggregated dashboard statistics for the authenticated user:
    Total links, total clicks, active links, average clicks, 14-day trend, top 5 links.
    """
    return get_user_overview_analytics(db=db, user_id=current_user.id)


@router.get("/{url_id}/stats", response_model=URLAnalyticsResponse)
def get_single_url_stats(
    url_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve detailed daily click breakdown and recent access events for a specific user link.
    """
    url_obj = db.query(URL).filter(URL.id == url_id, URL.user_id == current_user.id).first()
    if not url_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL not found or you do not have permission to view its analytics."
        )

    # Daily breakdown
    daily_rows = (
        db.query(DailyClickStats)
        .filter(DailyClickStats.url_id == url_obj.id)
        .order_by(DailyClickStats.date.asc())
        .all()
    )
    daily_stats = [
        DailyStatItem(date=row.date.isoformat(), clicks=row.click_count)
        for row in daily_rows
    ]

    # Recent clicks (up to 20)
    recent_rows = (
        db.query(ClickEvent)
        .filter(ClickEvent.url_id == url_obj.id)
        .order_by(desc(ClickEvent.clicked_at))
        .limit(20)
        .all()
    )
    recent_clicks = [
        RecentClickItem(
            clicked_at=row.clicked_at,
            referer=row.referer,
            user_agent_summary=row.user_agent_summary
        )
        for row in recent_rows
    ]

    return URLAnalyticsResponse(
        id=url_obj.id,
        short_code=url_obj.short_code,
        short_url=build_short_url(url_obj.short_code),
        original_url=url_obj.original_url,
        total_clicks=url_obj.click_count,
        created_at=url_obj.created_at,
        expires_at=url_obj.expires_at,
        is_active=url_obj.is_active,
        daily_stats=daily_stats,
        recent_clicks=recent_clicks
    )
