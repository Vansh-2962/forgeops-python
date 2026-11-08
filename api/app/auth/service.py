import base64
import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode, urlsplit
from uuid import UUID

import httpx
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import AuthSession, User
from app.config import settings

password_hash = PasswordHash.recommended()
DUMMY_PASSWORD_HASH = password_hash.hash(secrets.token_urlsafe(32))


def normalize_email(email: str) -> str:
    normalized = email.strip().casefold()
    local, separator, domain = normalized.partition("@")
    if (
        not separator
        or not local
        or not domain
        or "." not in domain
        or any(char.isspace() for char in normalized)
    ):
        raise ValueError("Enter a valid email address")
    return normalized


def session_token_hash(token: str) -> str:
    return hmac.new(
        settings.better_auth_secret.encode(),
        token.encode(),
        hashlib.sha256,
    ).hexdigest()


def secure_cookie() -> bool:
    if settings.session_cookie_secure is not None:
        return settings.session_cookie_secure
    return settings.environment.casefold() not in {"development", "dev", "test"}


def safe_return_path(value: str | None) -> str:
    if not value:
        return "/dashboard"
    parsed = urlsplit(value)
    if (
        not value.startswith("/")
        or value.startswith("//")
        or "\\" in value
        or parsed.scheme
        or parsed.netloc
        or any(ord(character) < 32 for character in value)
    ):
        return "/dashboard"
    return value


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def register(
        self,
        email: str,
        password: str,
        name: str | None,
    ) -> User:
        normalized_email = normalize_email(email)
        existing = await self.session.scalar(
            select(User).where(User.email == normalized_email)
        )
        if existing is not None:
            raise ValueError("An account with this email already exists")
        user_name = (name or normalized_email.split("@", 1)[0]).strip()
        if not user_name:
            raise ValueError("Name cannot be empty")
        user = User(
            email=normalized_email,
            name=user_name,
            password_hash=password_hash.hash(password),
            email_verified=False,
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def login(self, email: str, password: str) -> tuple[User, str, datetime]:
        normalized_email = normalize_email(email)
        user = await self.session.scalar(
            select(User).where(User.email == normalized_email)
        )
        stored_hash = (
            user.password_hash
            if user is not None and user.password_hash is not None
            else DUMMY_PASSWORD_HASH
        )
        password_matches = password_hash.verify(password, stored_hash)
        if user is None or user.password_hash is None or not password_matches:
            raise ValueError("Invalid email or password")
        token, expires_at = await self.create_session(user.id)
        return user, token, expires_at

    async def create_session(self, user_id: UUID) -> tuple[str, datetime]:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(UTC) + timedelta(days=settings.session_max_age_days)
        self.session.add(
            AuthSession(
                token_hash=session_token_hash(token),
                user_id=user_id,
                expires_at=expires_at,
            )
        )
        await self.session.commit()
        return token, expires_at

    async def user_for_token(self, token: str | None) -> tuple[User, AuthSession] | None:
        if not token:
            return None
        token_digest = session_token_hash(token)
        auth_session = await self.session.scalar(
            select(AuthSession).where(AuthSession.token_hash == token_digest)
        )
        if auth_session is None:
            return None
        if auth_session.expires_at <= datetime.now(UTC):
            await self.session.delete(auth_session)
            await self.session.commit()
            return None
        user = await self.session.get(User, auth_session.user_id)
        if user is None:
            return None
        return user, auth_session

    async def delete_session(self, token: str | None) -> None:
        if token:
            auth_session = await self.session.get(
                AuthSession,
                session_token_hash(token),
            )
            if auth_session is not None:
                await self.session.delete(auth_session)
                await self.session.commit()

    async def google_authorization_url(self, return_to: str | None) -> tuple[str, str]:
        if not settings.google_client_id or not settings.google_callback_url:
            raise RuntimeError("Google sign-in is not configured")
        nonce = secrets.token_urlsafe(32)
        signed_state = self._sign_google_state(nonce, safe_return_path(return_to))
        query = urlencode(
            {
                "client_id": settings.google_client_id,
                "redirect_uri": settings.google_callback_url,
                "response_type": "code",
                "scope": "openid email profile",
                "state": signed_state,
                "prompt": "select_account",
            }
        )
        return f"https://accounts.google.com/o/oauth2/v2/auth?{query}", nonce

    @staticmethod
    def _sign_google_state(nonce: str, return_to: str) -> str:
        path = base64.urlsafe_b64encode(return_to.encode()).decode().rstrip("=")
        payload = f"{nonce}:{path}"
        signature = hmac.new(
            settings.better_auth_secret.encode(),
            payload.encode(),
            hashlib.sha256,
        ).hexdigest()
        return f"{nonce}.{path}.{signature}"

    @staticmethod
    def verify_google_state(state: str, cookie_nonce: str | None) -> str:
        try:
            nonce, path, signature = state.split(".", 2)
        except ValueError as exc:
            raise ValueError("Invalid OAuth state") from exc
        payload = f"{nonce}:{path}"
        expected = hmac.new(
            settings.better_auth_secret.encode(),
            payload.encode(),
            hashlib.sha256,
        ).hexdigest()
        if (
            cookie_nonce is None
            or not hmac.compare_digest(nonce, cookie_nonce)
            or not hmac.compare_digest(signature, expected)
        ):
            raise ValueError("Invalid OAuth state")
        padded_path = path + "=" * (-len(path) % 4)
        try:
            return safe_return_path(
                base64.urlsafe_b64decode(padded_path).decode()
            )
        except (ValueError, UnicodeDecodeError) as exc:
            raise ValueError("Invalid OAuth state") from exc

    async def google_user(self, code: str) -> User:
        if (
            not settings.google_client_id
            or not settings.google_client_secret
            or not settings.google_callback_url
        ):
            raise RuntimeError("Google sign-in is not configured")
        async with httpx.AsyncClient(timeout=15.0) as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": settings.google_callback_url,
                    "grant_type": "authorization_code",
                },
            )
            token_response.raise_for_status()
            access_token = token_response.json().get("access_token")
            if not access_token:
                raise ValueError("Google did not return an access token")
            profile_response = await client.get(
                "https://openidconnect.googleapis.com/v1/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            profile_response.raise_for_status()
        profile = profile_response.json()
        email = normalize_email(profile.get("email", ""))
        if profile.get("email_verified") is not True:
            raise ValueError("Google account email is not verified")

        user = await self.session.scalar(select(User).where(User.email == email))
        if user is None:
            user = User(
                email=email,
                name=(profile.get("name") or email.split("@", 1)[0])[:160],
                image=profile.get("picture"),
                email_verified=True,
            )
            self.session.add(user)
        else:
            user.email_verified = True
            if profile.get("name"):
                user.name = profile["name"][:160]
            if profile.get("picture"):
                user.image = profile["picture"][:2048]
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def create_google_session(self, user: User) -> tuple[str, datetime]:
        return await self.create_session(user.id)
