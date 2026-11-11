from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.url import URL
from app.models.analytics import DailyClickStats
from app.core.redis import redis_manager


def test_redirect_http_302_and_301(client: TestClient, db_session: Session, fake_redis):
    # Create 302 link
    url_302 = URL(
        original_url="https://google.com/search?q=fastapi",
        short_code="gsearch",
        redirect_type=302,
        is_active=True,
        click_count=0
    )
    # Create 301 link
    url_301 = URL(
        original_url="https://python.org",
        short_code="pyorg",
        redirect_type=301,
        is_active=True,
        click_count=0
    )
    db_session.add_all([url_302, url_301])
    db_session.commit()

    # Request 302 redirect (follow_redirects=False to verify header and status)
    resp302 = client.get("/r/gsearch", follow_redirects=False)
    assert resp302.status_code == 302
    assert resp302.headers["location"] == "https://google.com/search?q=fastapi"

    # Request 301 redirect
    resp301 = client.get("/r/pyorg", follow_redirects=False)
    assert resp301.status_code == 301
    assert resp301.headers["location"] == "https://python.org"


def test_redis_cache_aside_hits_and_misses(client: TestClient, db_session: Session, fake_redis):
    url = URL(
        original_url="https://fastapi.tiangolo.com",
        short_code="fastapi-docs",
        redirect_type=302,
        is_active=True,
        click_count=0
    )
    db_session.add(url)
    db_session.commit()

    # First request: Cache MISS (source is db)
    resp1 = client.get("/r/fastapi-docs", follow_redirects=False)
    assert resp1.status_code == 302
    assert resp1.headers.get("X-LinkFlow-Cache") == "MISS"

    # Verify Redis now contains the cached entry
    cached_val = fake_redis.get("url:fastapi-docs")
    assert cached_val is not None
    assert "https://fastapi.tiangolo.com" in cached_val

    # Second request: Cache HIT (source is cache)
    resp2 = client.get("/r/fastapi-docs", follow_redirects=False)
    assert resp2.status_code == 302
    assert resp2.headers.get("X-LinkFlow-Cache") == "HIT"


def test_redis_graceful_fallback_when_unavailable(client: TestClient, db_session: Session):
    url = URL(
        original_url="https://redis.io",
        short_code="redis-site",
        redirect_type=302,
        is_active=True,
        click_count=0
    )
    db_session.add(url)
    db_session.commit()

    # Simulate Redis connection failure
    orig_connected = redis_manager._is_connected
    orig_client = redis_manager._client
    redis_manager._is_connected = False
    redis_manager._client = None

    try:
        # Redirection should still succeed smoothly by reading from SQLite/PostgreSQL
        resp = client.get("/r/redis-site", follow_redirects=False)
        assert resp.status_code == 302
        assert resp.headers["location"] == "https://redis.io"
        assert resp.headers.get("X-LinkFlow-Cache") == "MISS"
    finally:
        redis_manager._is_connected = orig_connected
        redis_manager._client = orig_client


def test_click_tracking_and_daily_stats(client: TestClient, db_session: Session):
    url = URL(
        original_url="https://bitly.com",
        short_code="bitly-link",
        redirect_type=302,
        is_active=True,
        click_count=0
    )
    db_session.add(url)
    db_session.commit()
    db_session.refresh(url)

    # Click the link twice
    client.get("/r/bitly-link", follow_redirects=False)
    client.get("/r/bitly-link", follow_redirects=False)

    # Verify click_count on URL model
    db_session.refresh(url)
    assert url.click_count == 2

    # Verify DailyClickStats record
    today = datetime.now(timezone.utc).date()
    stat = db_session.query(DailyClickStats).filter(
        DailyClickStats.url_id == url.id,
        DailyClickStats.date == today
    ).first()
    assert stat is not None
    assert stat.click_count == 2


def test_expired_link_returns_410(client: TestClient, db_session: Session):
    # Expired 2 days ago
    expired_time = datetime.now(timezone.utc) - timedelta(days=2)
    url = URL(
        original_url="https://expired-site.com",
        short_code="old-link",
        expires_at=expired_time,
        is_active=True,
        click_count=0
    )
    db_session.add(url)
    db_session.commit()

    resp = client.get("/r/old-link", follow_redirects=False)
    assert resp.status_code == 410
    assert "expired" in resp.json()["detail"]


def test_inactive_link_returns_410(client: TestClient, db_session: Session):
    url = URL(
        original_url="https://inactive-site.com",
        short_code="disabled-link",
        is_active=False,
        click_count=0
    )
    db_session.add(url)
    db_session.commit()

    resp = client.get("/r/disabled-link", follow_redirects=False)
    assert resp.status_code == 410
    assert "disabled" in resp.json()["detail"]


def test_nonexistent_link_returns_404(client: TestClient):
    resp = client.get("/r/unknown999", follow_redirects=False)
    assert resp.status_code == 404
