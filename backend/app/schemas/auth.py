from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Login request with email and password."""

    email: EmailStr = Field(..., description="Admin email address")
    password: str = Field(..., min_length=1, description="Admin password")


class TokenResponse(BaseModel):
    """JWT token response."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")


class AdminUserResponse(BaseModel):
    """Admin user information response."""

    id: UUID = Field(..., description="Admin user ID")
    email: str = Field(..., description="Admin email address")
    is_active: bool = Field(..., description="Whether admin account is active")
    created_at: datetime = Field(..., description="Account creation timestamp")
    updated_at: datetime = Field(..., description="Account last update timestamp")

    class Config:
        from_attributes = True
