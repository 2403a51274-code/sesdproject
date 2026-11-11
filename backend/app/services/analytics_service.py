import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from fastapi import Request

from app.models.url import URL
from app.models.analytics import DailyClickStats, ClickEvent
from app.core.config import settings


def hash_ip(ip: Optional[str]) -> Optional[str]:
    """Anonymize IP address with SHA-256 and app secret salt for GDPR/privacy compliance."""
    if not ip:
        return None
    salt = settings.JWT_SECRET_KEY[:16]
    return hashlib.sha256(f"{ip}:{salt}".encode("utf-8")).hexdigest()[:32]


def record_click(
    db: Session,
    url_id: int,
    request: Optional[Request] = None
) -> None:
    """
    Record click event asynchronously / swiftly without blocking redirect.
    1. Increments total click count on URL.
    2. Upserts DailyClickStats for current date.
    3. Records anonymized ClickEvent for trend analysis.
    """
    try:
        now = datetime.now(timezone.utc)
        today = now.date()

        # 1. Increment total URL click count
        url_obj = db.query(URL).filter(URL.id == url_id).first()
        if url_obj:
            url_obj.click_count += 1

        # 2. Daily Click Statistics (Upsert)
        daily_stat = db.query(DailyClickStats).filter(
            DailyClickStats.url_id == url_id,
            DailyClickStats.date == today
        ).first()

        if daily_stat:
            daily_stat.click_count += 1
        else:
            daily_stat = DailyClickStats(
                url_id=url_id,
                date=today,
                click_count=1
            )
            db.add(daily_stat)

        # 3. Privacy-preserving ClickEvent
        client_ip = None
        referer = None
        user_agent_summary = None

        if request:
            # Check forwarded header or client host
            forwarded = request.headers.get("x-forwarded-for")
            client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else None)
            referer = request.headers.get("referer")
            raw_ua = request.headers.get("user-agent", "")
            if "Chrome" in raw_ua:
                user_agent_summary = "Chrome"
            elif "Firefox" in raw_ua:
                user_agent_summary = "Firefox"
            elif "Safari" in raw_ua and "Chrome" not in raw_ua:
                user_agent_summary = "Safari"
            elif "Edge" in raw_ua:
                user_agent_summary = "Edge"
            elif "bot" in raw_ua.lower() or "spider" in raw_ua.lower():
                user_agent_summary = "Bot"
            else:
                user_agent_summary = "Other"

        click_event = ClickEvent(
            url_id=url_id,
            clicked_at=now,
            ip_hash=hash_ip(client_ip),
            referer=referer[:250] if referer else None,
            user_agent_summary=user_agent_summary
        )
        db.add(click_event)

        db.commit()
    except Exception as exc:
        db.rollback()
        # Logging error without crashing redirection
        import logging
        logging.getLogger(__name__).error("Failed to record click for URL %s: %s", url_id, exc)


def get_user_overview_analytics(db: Session, user_id: int) -> Dict[str, Any]:
    """Calculate aggregated analytics across all links created by the user."""
    user_urls = db.query(URL).filter(URL.user_id == user_id).all()
    total_links = len(user_urls)
    total_clicks = sum(u.click_count for u in user_urls)
    now = datetime.now(timezone.utc)
    active_links = sum(1 for u in user_urls if u.is_active and (u.expires_at is None or u.expires_at > now))
    avg_clicks = round(total_clicks / total_links, 2) if total_links > 0 else 0.0

    # Top performing links (up to 5)
    top_links = (
        db.query(URL)
        .filter(URL.user_id == user_id)
        .order_by(desc(URL.click_count))
        .limit(5)
        .all()
    )

    # Daily click trends over last 30 days
    url_ids = [u.id for u in user_urls]
    daily_stats_map: Dict[str, int] = {}
    
    # Initialize past 14 days with 0 clicks
    for i in range(13, -1, -1):
        day_str = (now.date() - timedelta(days=i)).isoformat()
        daily_stats_map[day_str] = 0

    if url_ids:
        start_date = now.date() - timedelta(days=30)
        daily_rows = (
            db.query(DailyClickStats.date, func.sum(DailyClickStats.click_count))
            .filter(DailyClickStats.url_id.in_(url_ids), DailyClickStats.date >= start_date)
            .group_by(DailyClickStats.date)
            .all()
        )
        for d, count in daily_rows:
            daily_stats_map[d.isoformat()] = count

    # Sorted list of daily stats
    click_trends = [
        {"date": d, "clicks": count}
        for d, count in sorted(daily_stats_map.items())
    ]

    return {
        "total_links": total_links,
        "total_clicks": total_clicks,
        "active_links": active_links,
        "avg_clicks_per_link": avg_clicks,
        "click_trends": click_trends,
        "top_links": [
            {
                "id": u.id,
                "short_code": u.short_code,
                "short_url": f"{settings.BACKEND_URL}/r/{u.short_code}",
                "original_url": u.original_url,
                "click_count": u.click_count,
                "created_at": u.created_at,
            }
            for u in top_links
        ]
    }
