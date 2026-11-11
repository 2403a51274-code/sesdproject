import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import fakeredis

# Set testing environment before importing app modules
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["ENVIRONMENT"] = "testing"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-at-least-32-characters-long!"

from app.database.session import Base, get_db
from app.main import app
from app.core.redis import redis_manager
from app.models.user import User
from app.models.auth_tokens import EmailVerificationToken
from app.core.security import hash_password, create_access_token

# Test in-memory SQLite engine
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def db_session() -> Generator:
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def fake_redis():
    """Provides an isolated fakeredis client for Redis caching tests."""
    server = fakeredis.FakeServer()
    client = fakeredis.FakeRedis(server=server, decode_responses=True)
    orig_client = redis_manager._client
    orig_connected = redis_manager._is_connected
    
    redis_manager._client = client
    redis_manager._is_connected = True
    yield client
    
    redis_manager._client = orig_client
    redis_manager._is_connected = orig_connected


@pytest.fixture
def client() -> Generator:
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def verified_user(db_session) -> User:
    user = User(
        full_name="Alice Smith",
        email="alice@example.com",
        hashed_password=hash_password("Password123!"),
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def user_two(db_session) -> User:
    user = User(
        full_name="Bob Jones",
        email="bob@example.com",
        hashed_password=hash_password("Password123!"),
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(verified_user: User) -> dict:
    token = create_access_token(subject=verified_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_user_two(user_two: User) -> dict:
    token = create_access_token(subject=user_two.id)
    return {"Authorization": f"Bearer {token}"}
