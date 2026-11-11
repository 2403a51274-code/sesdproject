from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.auth_tokens import EmailVerificationToken, PasswordResetToken


def test_user_registration_success(client: TestClient, db_session: Session):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "New Tester",
            "email": "newtester@example.com",
            "password": "SecurePassword123!"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "Registration successful" in data["message"]

    # Verify user exists in database and is_verified is False
    user = db_session.query(User).filter(User.email == "newtester@example.com").first()
    assert user is not None
    assert user.is_verified is False

    # Verify email token created
    token_record = db_session.query(EmailVerificationToken).filter(EmailVerificationToken.user_id == user.id).first()
    assert token_record is not None
    assert token_record.token is not None


def test_duplicate_email_registration_fails(client: TestClient, verified_user: User):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Another User",
            "email": verified_user.email,  # same email
            "password": "Password123!"
        }
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_login_success(client: TestClient, verified_user: User):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": verified_user.email,
            "password": "Password123!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == verified_user.email


def test_login_incorrect_password(client: TestClient, verified_user: User):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": verified_user.email,
            "password": "WrongPassword!"
        }
    )
    assert response.status_code == 401
    assert "Incorrect email address or password" in response.json()["detail"]


def test_login_unverified_user_blocked(client: TestClient, db_session: Session):
    from app.core.security import hash_password
    unverified = User(
        full_name="Unverified User",
        email="unverified@example.com",
        hashed_password=hash_password("Password123!"),
        is_verified=False
    )
    db_session.add(unverified)
    db_session.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "unverified@example.com",
            "password": "Password123!"
        }
    )
    assert response.status_code == 403
    assert "has not been verified" in response.json()["detail"]


def test_email_verification_flow(client: TestClient, db_session: Session):
    from app.core.security import hash_password, generate_secure_token
    from datetime import datetime, timezone, timedelta

    user = User(
        full_name="Verif User",
        email="verify_flow@example.com",
        hashed_password=hash_password("Password123!"),
        is_verified=False
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = generate_secure_token(32)
    tok_obj = EmailVerificationToken(
        user_id=user.id,
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
    )
    db_session.add(tok_obj)
    db_session.commit()

    # Call verification endpoint
    resp = client.get(f"/api/v1/auth/verify-email?token={token}")
    assert resp.status_code == 200
    assert resp.json()["success"] is True

    # User is now verified in DB
    db_session.refresh(user)
    assert user.is_verified is True

    # Re-using the same token should fail
    resp_reuse = client.get(f"/api/v1/auth/verify-email?token={token}")
    assert resp_reuse.status_code == 400


def test_forgot_and_reset_password_flow(client: TestClient, verified_user: User, db_session: Session):
    # Forgot password request
    resp = client.post("/api/v1/auth/forgot-password", json={"email": verified_user.email})
    assert resp.status_code == 200
    assert "dispatched" in resp.json()["message"]

    # Check reset token created
    tok = db_session.query(PasswordResetToken).filter(PasswordResetToken.user_id == verified_user.id).order_by(PasswordResetToken.id.desc()).first()
    assert tok is not None

    # Reset password with the token
    reset_resp = client.post(
        "/api/v1/auth/reset-password",
        json={
            "token": tok.token,
            "new_password": "BrandNewPassword123!"
        }
    )
    assert reset_resp.status_code == 200
    assert reset_resp.json()["success"] is True

    # Test login with old password fails
    fail_login = client.post(
        "/api/v1/auth/login",
        json={"email": verified_user.email, "password": "Password123!"}
    )
    assert fail_login.status_code == 401

    # Test login with new password succeeds
    succ_login = client.post(
        "/api/v1/auth/login",
        json={"email": verified_user.email, "password": "BrandNewPassword123!"}
    )
    assert succ_login.status_code == 200


def test_me_endpoint_requires_auth(client: TestClient):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_endpoint_authenticated(client: TestClient, verified_user: User, auth_headers: dict):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == verified_user.email
    assert data["full_name"] == verified_user.full_name
    assert "total_links" in data
    assert "total_clicks" in data
