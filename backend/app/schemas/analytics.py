from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel


class DailyStatItem(BaseModel):
    date: str
    clicks: int


class RecentClickItem(BaseModel):
    clicked_at: datetime
    referer: Optional[str] = None
    user_agent_summary: Optional[str] = None


class TopLinkItem(BaseModel):
    id: int
    short_code: str
    short_url: str
    original_url: str
    click_count: int
    created_at: datetime


class URLAnalyticsResponse(BaseModel):
    id: int
    short_code: str
    short_url: str
    original_url: str
    total_clicks: int
    created_at: datetime
    expires_at: Optional[datetime] = None
    is_active: bool
    daily_stats: List[DailyStatItem]
    recent_clicks: List[RecentClickItem]


class OverviewAnalyticsResponse(BaseModel):
    total_links: int
    total_clicks: int
    active_links: int
    avg_clicks_per_link: float
    click_trends: List[DailyStatItem]
    top_links: List[TopLinkItem]
