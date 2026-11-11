import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, List, Dict, Any

from app.core.config import settings

logger = logging.getLogger(__name__)

# In-memory store of dispatched emails for unit testing and local inspection
sent_emails_store: List[Dict[str, Any]] = []


def is_smtp_configured() -> bool:
    """Return True if an external SMTP provider has been set up."""
    return bool(settings.SMTP_HOST and settings.SMTP_HOST.strip())


def send_verification_email(to_email: str, token: str) -> Dict[str, Any]:
    """
    Send an email verification message containing a secure verification link.
    If an external SMTP provider is configured, connects via SMTP over TLS.
    If no provider is configured, safely logs the link to console and appends to
    the inspection outbox.
    """
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    subject = "Verify your LinkFlow account"
    text_content = f"""
Hello,

Thank you for registering with LinkFlow!
Please verify your email address by opening the following link:

{verify_url}

This link will expire in 24 hours.
If you did not create a LinkFlow account, you can safely ignore this email.

Best regards,
The LinkFlow Team
    """
    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b; margin-bottom: 16px;">Welcome to LinkFlow</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.5;">
            Thank you for creating an account. Please click the button below to verify your email address and activate your account.
        </p>
        <div style="margin: 28px 0;">
            <a href="{verify_url}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
                Verify Email Address
            </a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.4;">
            Or copy and paste this link into your browser:<br>
            <a href="{verify_url}" style="color: #4f46e5; word-break: break-all;">{verify_url}</a>
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 12px;">This verification link expires in 24 hours. If you did not create an account, no further action is required.</p>
    </div>
    """

    email_record = {
        "to": to_email,
        "subject": subject,
        "token": token,
        "verify_url": verify_url,
        "smtp_dispatched": False,
    }

    if is_smtp_configured():
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = to_email
            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                if settings.SMTP_TLS:
                    server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)

            email_record["smtp_dispatched"] = True
            logger.info("Verification email sent via SMTP to %s", to_email)
        except Exception as exc:
            logger.error("Failed to send verification email via SMTP to %s: %s", to_email, exc)
            email_record["error"] = str(exc)
    else:
        logger.info(
            "[LinkFlow Email Service] SMTP not configured. Emulating verification email dispatch.\n"
            "Recipient: %s\n"
            "Verification Link: %s",
            to_email,
            verify_url
        )

    sent_emails_store.append(email_record)
    return email_record


def send_password_reset_email(to_email: str, token: str) -> Dict[str, Any]:
    """
    Send a password reset message containing a secure reset link.
    """
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    subject = "Reset your LinkFlow password"
    text_content = f"""
Hello,

We received a request to reset your LinkFlow password.
You can reset your password using the following link:

{reset_url}

This link is valid for 1 hour.
If you did not request a password reset, you can safely ignore this email.

Best regards,
The LinkFlow Team
    """
    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b; margin-bottom: 16px;">Reset Your Password</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.5;">
            We received a request to reset your LinkFlow password. Click the button below to choose a new password.
        </p>
        <div style="margin: 28px 0;">
            <a href="{reset_url}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
                Reset Password
            </a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.4;">
            Or copy and paste this link into your browser:<br>
            <a href="{reset_url}" style="color: #4f46e5; word-break: break-all;">{reset_url}</a>
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 12px;">This link is valid for 1 hour. If you did not make this request, your account remains secure.</p>
    </div>
    """

    email_record = {
        "to": to_email,
        "subject": subject,
        "token": token,
        "reset_url": reset_url,
        "smtp_dispatched": False,
    }

    if is_smtp_configured():
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = to_email
            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                if settings.SMTP_TLS:
                    server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)

            email_record["smtp_dispatched"] = True
            logger.info("Password reset email sent via SMTP to %s", to_email)
        except Exception as exc:
            logger.error("Failed to send password reset email via SMTP: %s", exc)
            email_record["error"] = str(exc)
    else:
        logger.info(
            "[LinkFlow Email Service] SMTP not configured. Emulating password reset email.\n"
            "Recipient: %s\n"
            "Reset Link: %s",
            to_email,
            reset_url
        )

    sent_emails_store.append(email_record)
    return email_record
