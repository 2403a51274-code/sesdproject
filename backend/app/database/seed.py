import logging
from datetime import datetime, timezone, timedelta, date
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.url import URL
from app.models.analytics import DailyClickStats, ClickEvent
from app.core.security import hash_password

logger = logging.getLogger("linkflow.seed")

DEMO_EMAIL = "demo@linkflow.local"
DEMO_PASSWORD = "Demo12345!"
DEMO_NAME = "Demo User"


def seed_demo_data_if_empty(db: Session) -> None:
    """Ensure a verified demo user with starter links exists in the database."""
    try:
        user = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if not user:
            logger.info("Seeding default verified demo user: %s", DEMO_EMAIL)
            user = User(
                full_name=DEMO_NAME,
                email=DEMO_EMAIL,
                hashed_password=hash_password(DEMO_PASSWORD),
                is_verified=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            # Seed initial sample links
            sample_links = [
                ("https://github.com/2403a51274-code/sesdproject", "sesd-repo", 42),
                ("https://fastapi.tiangolo.com", "fastapi-docs", 19),
                ("https://nextjs.org", "nextjs-web", 28),
            ]
            today = date.today()
            for orig, code, clicks in sample_links:
                url_obj = URL(
                    user_id=user.id,
                    original_url=orig,
                    short_code=code,
                    click_count=clicks,
                    redirect_type=302,
                    is_active=True,
                )
                db.add(url_obj)
                db.commit()
                db.refresh(url_obj)

                # Add sample time series stats
                for d in range(7):
                    day = today - timedelta(days=6 - d)
                    day_clicks = (clicks // 7) + (d % 3)
                    db.add(DailyClickStats(url_id=url_obj.id, date=day, click_count=day_clicks))

                # Add recent click event
                db.add(
                    ClickEvent(
                        url_id=url_obj.id,
                        clicked_at=datetime.now(timezone.utc) - timedelta(minutes=15 * (1 + len(orig) % 5)),
                        referer="https://google.com",
                        user_agent_summary="Chrome / Windows 11",
                    )
                )
            db.commit()
            logger.info("Seeding complete for demo user %s with sample analytics.", DEMO_EMAIL)
    except Exception as e:
        logger.warning("Demo seeding skipped or already present: %s", e)
        db.rollback()

