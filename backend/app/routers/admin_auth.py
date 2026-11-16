from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.admin import AdminUser
from app.schemas.auth import AdminUserResponse, LoginRequest, TokenResponse
from app.services.auth_service import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse, status_code=200)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate admin user and return JWT token.

    Args:
        request: Login credentials (email and password).
        db: Database session.

    Returns:
        JWT token response with access_token and token_type.

    Raises:
        HTTPException with 401 if credentials are invalid.
    """
    # Query admin user by email
    stmt = select(AdminUser).where(AdminUser.email == request.email)
    result = await db.execute(stmt)
    admin_user = result.scalar_one_or_none()

    # Verify user exists, is active, and password is correct
    if not admin_user or not admin_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(request.password, admin_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Generate JWT token
    access_token = create_access_token(data={"sub": str(admin_user.id)})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )


@router.get("/me", response_model=AdminUserResponse, status_code=200)
async def get_current_user(
    admin_user: Annotated[AdminUser, Depends(require_admin)],
) -> AdminUserResponse:
    """Get current authenticated admin user information.

    Args:
        admin_user: Current authenticated admin user from JWT token.

    Returns:
        Admin user information including id, email, and timestamps.
    """
    return AdminUserResponse.model_validate(admin_user)


@router.post("/logout", status_code=204)
async def logout(
    admin_user: Annotated[AdminUser, Depends(require_admin)],
) -> None:
    """Logout admin user.

    Note: Since we use stateless JWT tokens, this endpoint primarily serves
    as a signal to the frontend to clear local token storage. The token
    remains valid until expiration, which is why the expiration time should
    be kept reasonably short (e.g., 24 hours).

    Args:
        admin_user: Current authenticated admin user (validates token).
    """
    # With stateless JWT, no server-side action needed.
    # Client should discard the token.
    pass
