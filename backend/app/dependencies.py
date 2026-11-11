from fastapi import HTTPException, status


async def require_admin() -> None:
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Admin authentication is not configured",
    )
