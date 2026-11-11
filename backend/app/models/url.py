from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base


class URL(Base):
    __tablename__ = "urls"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    original_url = Column(Text, nullable=False)
    short_code = Column(String(64), unique=True, index=True, nullable=False)
    click_count = Column(Integer, default=0, nullable=False)
    redirect_type = Column(Integer, default=302, nullable=False)  # 301 or 302
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    user = relationship("User", back_populates="urls")
    daily_stats = relationship("DailyClickStats", back_populates="url", cascade="all, delete-orphan")
    clicks = relationship("ClickEvent", back_populates="url", cascade="all, delete-orphan")
