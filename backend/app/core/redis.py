import json
import logging
from typing import Optional, Dict, Any
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisManager:
    """
    Resilient Redis cache manager for LinkFlow.
    Implements cache-aside pattern with automatic fallback to database
    if Redis is unavailable or disconnected.
    """

    def __init__(self):
        self._client: Optional[redis.Redis] = None
        self._is_connected: bool = False
        self._last_connect_attempt: float = 0
        self._reconnect_interval: float = 10.0  # seconds between reconnect retries
        self._init_client()

    def _init_client(self) -> None:
        import time
        self._last_connect_attempt = time.time()
        if not settings.REDIS_ENABLED:
            logger.info("Redis is disabled via configuration.")
            return

        try:
            self._client = redis.Redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_timeout=0.5,
                socket_connect_timeout=0.5,
                retry_on_timeout=False,
            )
            # Ping to verify immediate connection
            self._client.ping()
            self._is_connected = True
            logger.info("Successfully connected to Redis cache at %s", settings.REDIS_URL)
        except Exception as e:
            self._is_connected = False
            logger.warning(
                "Redis connection failed (%s). System will gracefully fallback to primary database.",
                str(e)
            )

    @property
    def is_available(self) -> bool:
        import time
        now = time.time()
        if not self._is_connected:
            # Only retry connection after cooldown
            if now - self._last_connect_attempt > self._reconnect_interval:
                self._init_client()
            return self._is_connected

        if self._client is None:
            return False
        try:
            self._client.ping()
            return True
        except Exception:
            self._is_connected = False
            self._last_connect_attempt = now
            return False

    def get_url(self, short_code: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached URL data for a given short code.
        Returns None if cache miss or Redis unavailable.
        """
        if not self.is_available or self._client is None:
            return None

        try:
            key = f"url:{short_code}"
            raw = self._client.get(key)
            if raw:
                logger.debug("Redis cache HIT for short_code: %s", short_code)
                return json.loads(raw)
            logger.debug("Redis cache MISS for short_code: %s", short_code)
            return None
        except Exception as exc:
            logger.warning("Error reading from Redis cache: %s. Falling back to DB.", exc)
            return None

    def set_url(
        self,
        short_code: str,
        data: Dict[str, Any],
        ttl_seconds: Optional[int] = None
    ) -> bool:
        """
        Store URL mapping in Redis cache with TTL.
        """
        if not self.is_available or self._client is None:
            return False

        try:
            key = f"url:{short_code}"
            ttl = ttl_seconds or settings.REDIS_CACHE_TTL_SECONDS
            self._client.setex(key, ttl, json.dumps(data))
            logger.debug("Cached short_code %s in Redis (TTL: %ds)", short_code, ttl)
            return True
        except Exception as exc:
            logger.warning("Error saving to Redis cache: %s", exc)
            return False

    def delete_url(self, short_code: str) -> bool:
        """
        Invalidate cached URL entry upon update or deletion.
        """
        if not self.is_available or self._client is None:
            return False

        try:
            key = f"url:{short_code}"
            self._client.delete(key)
            logger.debug("Invalidated Redis cache for short_code %s", short_code)
            return True
        except Exception as exc:
            logger.warning("Error invalidating Redis cache: %s", exc)
            return False


# Singleton instance
redis_manager = RedisManager()
