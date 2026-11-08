from datetime import datetime
from urllib.parse import urlencode
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
import httpx
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_session, validate_request_origin
from app.auth.schemas import Credentials, SessionResponse, UserResponse
from app.auth.service import AuthService, secure_cookie
from app.config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])
OAUTH_STATE_COOKIE = "forgeops_oauth_state"


def set_session_cookie(
    response: Response,
    token: str,
    expires_at: datetime,
) -> None:
    max_age = max(0, int((expires_at - datetime.now(expires_at.tzinfo)).total_seconds()))
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=max_age,
        httponly=True,
        secure=secure_cookie(),
        samesite="lax",
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        httponly=True,
        secure=secure_cookie(),
        samesite="lax",
        path="/",
    )


@router.post(
    "/register",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    credentials: Credentials,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
):
    validate_request_origin(request)
    if credentials.password != credentials.password.strip():
        raise HTTPException(status_code=422, detail="Password cannot start or end with spaces")
    try:
        user = await AuthService(session).register(
            credentials.email,
            credentials.password,
            credentials.name,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=409 if "already exists" in str(exc) else 400,
            detail=str(exc),
        ) from exc
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=409,
            detail="Account could not be created. Try signing in.",
        ) from exc
    token, expires_at = await AuthService(session).create_session(user.id)
    set_session_cookie(response, token, expires_at)
    return SessionResponse(
        user=UserResponse.model_validate(user),
        expires_at=expires_at,
    )


@router.post("/login", response_model=SessionResponse)
async def login(
    credentials: Credentials,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
):
    validate_request_origin(request)
    try:
        user, token, expires_at = await AuthService(session).login(
            credentials.email,
            credentials.password,
        )
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid email or password") from exc
    set_session_cookie(response, token, expires_at)
    return SessionResponse(
        user=UserResponse.model_validate(user),
        expires_at=expires_at,
    )


@router.get("/session", response_model=SessionResponse)
async def get_auth_session(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    auth = await AuthService(session).user_for_token(
        request.cookies.get(settings.session_cookie_name)
    )
    if auth is None:
        return SessionResponse(user=None, expires_at=None)
    user, user_session = auth
    return SessionResponse(
        user=UserResponse.model_validate(user),
        expires_at=user_session.expires_at,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
):
    validate_request_origin(request)
    await AuthService(session).delete_session(
        request.cookies.get(settings.session_cookie_name)
    )
    clear_session_cookie(response)


@router.get("/google")
async def google_login(
    return_to: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    try:
        authorization_url, nonce = await AuthService(session).google_authorization_url(
            return_to
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    response = RedirectResponse(authorization_url, status_code=302)
    response.set_cookie(
        OAUTH_STATE_COOKIE,
        nonce,
        max_age=600,
        httponly=True,
        secure=secure_cookie(),
        samesite="lax",
        path="/auth/google/callback",
    )
    return response


@router.get("/google/callback")
async def google_callback(
    code: str,
    state: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    auth = AuthService(session)
    try:
        return_to = auth.verify_google_state(
            state,
            request.cookies.get(OAUTH_STATE_COOKIE),
        )
        user = await auth.google_user(code)
        token, expires_at = await auth.create_google_session(user)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Google sign-in is unavailable") from exc
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=400, detail="Google sign-in failed") from exc

    destination = f"{settings.frontend_url.rstrip('/')}{return_to}"
    response = RedirectResponse(destination, status_code=302)
    set_session_cookie(response, token, expires_at)
    response.delete_cookie(
        OAUTH_STATE_COOKIE,
        httponly=True,
        secure=secure_cookie(),
        samesite="lax",
        path="/auth/google/callback",
    )
    return response
