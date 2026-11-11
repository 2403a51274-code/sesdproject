from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, HttpUrl, field_validator, ConfigDict
import re


class URLBase(BaseModel):
    original_url: str = Field(..., description="Target destination URL")
    custom_alias: Optional[str] = Field(None, min_length=3, max_length=32, description="Optional custom short code")
    redirect_type: int = Field(default=302, description="HTTP redirect code (301 or 302)")
    expires_at: Optional[datetime] = Field(None, description="Optional expiration datetime")

    @field_validator("original_url")
    @classmethod
    def validate_http_url(cls, v: str) -> str:
        v = v.strip()
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("URL must start with http:// or https://")
        if len(v) > 2048:
            raise ValueError("URL exceeds maximum length of 2048 characters")
        return v

    @field_validator("redirect_type")
    @classmethod
    def validate_redirect_type(cls, v: int) -> int:
        if v not in (301, 302):
            raise ValueError("Redirect type must be either 301 (Permanent) or 302 (Temporary)")
        return v

    @field_validator("custom_alias")
    @classmethod
    def validate_custom_alias(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        v = v.strip()
        if not re.match(r"^[a-zA-Z0-9_-]{3,32}$", v):
            raise ValueError("Custom alias may only contain letters, numbers, hyphens, and underscores (3-32 characters)")
        # Avoid reserved route names
        reserved = {"api", "docs", "redoc", "openapi.json", "r", "login", "signup", "dashboard", "analytics", "static"}
        if v.lower() in reserved:
            raise ValueError(f"'{v}' is a reserved keyword and cannot be used as an alias")
        return v


class URLCreate(URLBase):
    pass


class PublicURLCreate(BaseModel):
    """Schema for public landing page quick shortening"""
    original_url: str

    @field_validator("original_url")
    @classmethod
    def validate_http_url(cls, v: str) -> str:
        v = v.strip()
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("URL must start with http:// or https://")
        if len(v) > 2048:
            raise ValueError("URL exceeds maximum length of 2048 characters")
        return v


class URLUpdate(BaseModel):
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None
    redirect_type: Optional[int] = None


class URLResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    original_url: str
    short_code: str
    short_url: str
    click_count: int
    redirect_type: int
    created_at: datetime
    expires_at: Optional[datetime] = None
    is_active: bool
    is_expired: bool = False

    model_config = ConfigDict(from_attributes=True)


class URLListResponse(BaseModel):
    items: List[URLResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
