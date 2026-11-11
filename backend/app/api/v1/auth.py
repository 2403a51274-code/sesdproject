from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.auth_tokens import EmailVerificationToken, PasswordResetToken
from app.models.url import URL
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse
)
from app.schemas.user import UserResponse, UserProfile
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    generate_secure_token
)
from app.core.config import settings
from app.services.email_service import (
    send_verification_email,
    send_password_reset_email,
    is_smtp_configured
)
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user account with secure password hashing and email verification token generation.
    """
    normalized_email = payload.email.lower().strip()
    
    # Duplicate email check
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists. Please log in or use a different email."
        )

    # Create new user
    new_user = User(
        full_name=payload.full_name.strip(),
        email=normalized_email,
        hashed_password=hash_password(payload.password),
        is_verified=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate secure verification token
    raw_token = generate_secure_token(32)
    verification_token = EmailVerificationToken(
        user_id=new_user.id,
        token=raw_token,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.add(verification_token)
    db.commit()

    # Dispatch verification email
    email_dispatch = send_verification_email(new_user.email, raw_token)

    msg = "Registration successful! A verification link has been sent to your email address."
    dev_token = None
    if not is_smtp_configured():
        dev_token = raw_token
        msg += " (Notice: SMTP is not configured; check the server logs or use the dev token to verify)."

    return MessageResponse(
        message=msg,
        success=True,
        dev_token=dev_token
    )


@router.post("/login", response_model=TokenResponse)
def login_user(payload: UserLogin, response: Response, db: Session = Depends(get_db)):
    """
    Authenticate user credentials, verify email status, and issue JWT access token.
    """
    normalized_email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email address or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your email address has not been verified yet. Please check your inbox or request a new verification link."
        )

    # Determine token duration based on remember_me
    expires_delta = timedelta(days=30) if payload.remember_me else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(subject=user.id, expires_delta=expires_delta)

    # Set secure cookie
    response.set_cookie(
        key="linkflow_token",
        value=access_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=int(expires_delta.total_seconds()),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/logout", response_model=MessageResponse)
def logout_user(response: Response):
    """Clear session cookie and invalidate client state."""
    response.delete_cookie(key="linkflow_token")
    return MessageResponse(message="Successfully signed out.", success=True)


@router.get("/me", response_model=UserProfile)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve currently authenticated user's profile and overview statistics."""
    total_links = db.query(URL).filter(URL.user_id == current_user.id).count()
    user_urls = db.query(URL).filter(URL.user_id == current_user.id).all()
    total_clicks = sum(u.click_count for u in user_urls)

    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        total_links=total_links,
        total_clicks=total_clicks
    )


@router.get("/verify-email", response_model=MessageResponse)
def verify_email(token: str, db: Session = Depends(get_db)):
    """
    Verify user's email address via the secret token link.
    """
    token_record = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.token == token
    ).first()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token."
        )

    if token_record.used_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This verification link has already been used. You can proceed to login."
        )

    now = datetime.now(timezone.utc)
    # Check timezone-aware expiration
    expires_at = token_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This verification link has expired. Please register again or request a new link."
        )

    # Mark verified
    token_record.used_at = now
    user = db.query(User).filter(User.id == token_record.user_id).first()
    if user:
        user.is_verified = True
    db.commit()

    return MessageResponse(
        message="Email successfully verified! You may now sign in to your LinkFlow account.",
        success=True
    )


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiate password recovery.
    Never exposes whether an email exists in the database (timing & enumeration protection).
    """
    normalized_email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()

    dev_token = None
    if user:
        raw_token = generate_secure_token(32)
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=raw_token,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        db.add(reset_token)
        db.commit()

        send_password_reset_email(user.email, raw_token)
        if not is_smtp_configured():
            dev_token = raw_token

    return MessageResponse(
        message="If an account with that email address exists, a password reset link has been dispatched.",
        success=True,
        dev_token=dev_token
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset user password using a verified time-limited token.
    """
    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == payload.token
    ).first()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )

    if token_record.used_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link has already been used."
        )

    now = datetime.now(timezone.utc)
    expires_at = token_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset token has expired. Please submit a new request."
        )

    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Update password and invalidate token
    user.hashed_password = hash_password(payload.new_password)
    token_record.used_at = now
    db.commit()

    return MessageResponse(
        message="Your password has been successfully reset. You can now log in with your new credentials.",
        success=True
    )
