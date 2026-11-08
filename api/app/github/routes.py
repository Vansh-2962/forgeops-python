import base64
import hashlib
import hmac
import secrets
from datetime import UTC, datetime
from urllib.parse import urlencode
from uuid import uuid4

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_session, require_user
from app.auth.models import GithubConnection, User
from app.auth.service import safe_return_path, secure_cookie
from app.config import settings
from app.events.database import SessionFactory
from app.github.client import GithubAPIError, GithubClient
from app.github.connections import (
    encrypt_github_token,
    get_github_connection,
    list_user_repositories,
)

router = APIRouter(prefix="/github", tags=["github"])
GITHUB_STATE_COOKIE = "forgeops_github_state"


def _signed_state(user_id: str, nonce: str, return_to: str) -> str:
    path = base64.urlsafe_b64encode(return_to.encode()).decode().rstrip("=")
    payload = f"{user_id}:{nonce}:{path}"
    signature = hmac.new(
        settings.better_auth_secret.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()
    return f"{payload}:{signature}"


def _validate_state(
    state: str,
    cookie_nonce: str | None,
    user_id: str,
) -> str:
    try:
        state_user, nonce, encoded_path, signature = state.split(":", 3)
    except ValueError as exc:
        raise ValueError("Invalid GitHub OAuth state") from exc
    payload = f"{state_user}:{nonce}:{encoded_path}"
    expected = hmac.new(
        settings.better_auth_secret.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()
    if (
        cookie_nonce is None
        or not hmac.compare_digest(cookie_nonce, nonce)
        or not hmac.compare_digest(user_id, state_user)
        or not hmac.compare_digest(signature, expected)
    ):
        raise ValueError("Invalid GitHub OAuth state")
    padded_path = encoded_path + "=" * (-len(encoded_path) % 4)
    try:
        return safe_return_path(base64.urlsafe_b64decode(padded_path).decode())
    except (ValueError, UnicodeDecodeError) as exc:
        raise ValueError("Invalid GitHub OAuth state") from exc


@router.get("/status")
async def github_connection_status(user: User = Depends(require_user)):
    async with SessionFactory() as session:
        connection = await get_github_connection(session, user.id)
        return {
            "configured": bool(
                settings.github_oauth_client_id
                and settings.github_oauth_client_secret
                and settings.github_oauth_callback_url
            ),
            "connected": connection is not None,
            "login": connection.github_login if connection else None,
            "connectedAt": connection.connected_at if connection else None,
        }


@router.get("/connect")
async def connect_github(
    return_to: str | None = None,
    user: User = Depends(require_user),
):
    if not (
        settings.github_oauth_client_id
        and settings.github_oauth_client_secret
        and settings.github_oauth_callback_url
    ):
        raise HTTPException(
            status_code=503,
            detail="GitHub OAuth is not configured on this server.",
        )
    nonce = secrets.token_urlsafe(32)
    state = _signed_state(
        str(user.id),
        nonce,
        safe_return_path(return_to),
    )
    query = urlencode(
        {
            "client_id": settings.github_oauth_client_id,
            "redirect_uri": settings.github_oauth_callback_url,
            "scope": "repo",
            "state": state,
        }
    )
    response = RedirectResponse(
        f"https://github.com/login/oauth/authorize?{query}",
        status_code=302,
    )
    response.set_cookie(
        GITHUB_STATE_COOKIE,
        nonce,
        max_age=600,
        httponly=True,
        secure=secure_cookie(),
        samesite="lax",
        path="/github/callback",
    )
    return response


@router.get("/callback")
async def github_callback(
    code: str,
    state: str,
    request: Request,
    user: User = Depends(require_user),
    session: AsyncSession = Depends(get_session),
):
    if not (
        settings.github_oauth_client_id
        and settings.github_oauth_client_secret
        and settings.github_oauth_callback_url
    ):
        raise HTTPException(
            status_code=503,
            detail="GitHub OAuth is not configured on this server.",
        )
    try:
        return_to = _validate_state(
            state,
            request.cookies.get(GITHUB_STATE_COOKIE),
            str(user.id),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="GitHub authorization failed.") from exc

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                json={
                    "client_id": settings.github_oauth_client_id,
                    "client_secret": settings.github_oauth_client_secret,
                    "code": code,
                    "redirect_uri": settings.github_oauth_callback_url,
                    "state": state,
                },
            )
            token_response.raise_for_status()
            token_data = token_response.json()
        access_token = token_data.get("access_token")
        if not isinstance(access_token, str) or not access_token:
            raise ValueError("GitHub did not return an access token")
        profile = await GithubClient(access_token).get("/user")
        github_login = profile.get("login")
        if not isinstance(github_login, str) or not github_login:
            raise ValueError("GitHub did not return a valid account profile")
    except (httpx.HTTPError, GithubAPIError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not complete GitHub authorization.",
        ) from exc

    existing = await session.scalar(
        select(GithubConnection)
        .where(GithubConnection.user_id == user.id)
        .with_for_update()
    )
    now = datetime.now(UTC)
    if existing is None:
        existing = GithubConnection(
            id=uuid4(),
            user_id=user.id,
            github_login=github_login,
            encrypted_access_token=encrypt_github_token(access_token),
            scopes=token_data.get("scope", ""),
            connected_at=now,
        )
        session.add(existing)
    else:
        existing.github_login = github_login
        existing.encrypted_access_token = encrypt_github_token(access_token)
        existing.scopes = token_data.get("scope", "")
        existing.connected_at = now
    await session.commit()

    redirect = RedirectResponse(
        f"{settings.frontend_url.rstrip('/')}{return_to}",
        status_code=302,
    )
    redirect.delete_cookie(
        GITHUB_STATE_COOKIE,
        httponly=True,
        secure=secure_cookie(),
        samesite="lax",
        path="/github/callback",
    )
    return redirect


@router.delete("/connection", status_code=204)
async def disconnect_github(
    user: User = Depends(require_user),
    session: AsyncSession = Depends(get_session),
):
    connection = await get_github_connection(session, user.id)
    if connection is not None:
        await session.delete(connection)
        await session.commit()
    return Response(status_code=204)


@router.get("/repos")
async def list_github_repositories(user: User = Depends(require_user)):
    try:
        repositories = await list_user_repositories(user.id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except GithubAPIError as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not load repositories from the connected GitHub account.",
        ) from exc
    return {"count": len(repositories), "repos": repositories}
