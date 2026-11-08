from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.service import AuthService
from app.config import settings
from app.events.database import SessionFactory


def validate_request_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    if origin is None:
        return
    allowed_origins = {
        item.strip().rstrip("/")
        for item in settings.frontend_origins.split(",")
        if item.strip()
    }
    allowed_origins.add(settings.frontend_url.rstrip("/"))
    if origin.rstrip("/") not in allowed_origins:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Request origin is not allowed",
        )


async def get_session():
    async with SessionFactory() as session:
        yield session


async def require_user(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> User:
    validate_request_origin(request)
    auth = await AuthService(session).user_for_token(
        request.cookies.get(settings.session_cookie_name)
    )
    if auth is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return auth[0]
