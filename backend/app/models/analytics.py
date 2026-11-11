from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.session import Base


class DailyClickStats(Base):
    __tablename__ = "daily_click_stats"
    __table_args__ = (
        UniqueConstraint("url_id", "date", name="uq_url_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    url_id = Column(Integer, ForeignKey("urls.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, default=lambda: datetime.now(timezone.utc).date(), nullable=False, index=True)
    click_count = Column(Integer, default=0, nullable=False)

    # Relationships
    url = relationship("URL", back_populates="daily_stats")


class ClickEvent(Base):
    """
    Detailed click events for deep analytics.
    User privacy: Stores only anonymized IP hash and high-level referrer/device metadata.
    Never stores plain PII.
    """
    __tablename__ = "click_events"

    id = Column(Integer, primary_key=True, index=True)
    url_id = Column(Integer, ForeignKey("urls.id", ondelete="CASCADE"), nullable=False, index=True)
    clicked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    ip_hash = Column(String(64), nullable=True)  # SHA-256 salted hash for user privacy
    referer = Column(String(256), nullable=True)
    user_agent_summary = Column(String(128), nullable=True)

    # Relationships
    url = relationship("URL", back_populates="clicks")
