import base64
import hashlib
from uuid import UUID

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import GithubConnection
from app.config import settings
from app.events.database import SessionFactory
from app.github.client import GithubClient
from app.github.repositories import GithubRepoService


def _cipher() -> Fernet:
    key = base64.urlsafe_b64encode(
        hashlib.sha256(
            settings.better_auth_secret.encode() + b":forgeops-github-token"
        ).digest()
    )
    return Fernet(key)


def encrypt_github_token(token: str) -> str:
    return _cipher().encrypt(token.encode()).decode()


def decrypt_github_token(encrypted_token: str) -> str:
    return _cipher().decrypt(encrypted_token.encode()).decode()


async def get_github_connection(
    session: AsyncSession,
    user_id: UUID,
) -> GithubConnection | None:
    return await session.scalar(
        select(GithubConnection).where(GithubConnection.user_id == user_id)
    )


async def get_github_token(user_id: UUID) -> str:
    async with SessionFactory() as session:
        connection = await get_github_connection(session, user_id)
        if connection is None:
            raise ValueError("Connect a GitHub account before using GitHub features")
        try:
            return decrypt_github_token(connection.encrypted_access_token)
        except InvalidToken as exc:
            raise ValueError(
                "Your GitHub connection cannot be decrypted. Reconnect your account."
            ) from exc


async def list_user_repositories(user_id: UUID) -> list[dict]:
    token = await get_github_token(user_id)
    return await GithubRepoService(
        GithubClient(token)
    ).list_repository_summaries()
