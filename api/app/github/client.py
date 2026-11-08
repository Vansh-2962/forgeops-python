from contextvars import ContextVar, Token
from typing import Any
from urllib.parse import unquote

import httpx

from app.config import settings

_github_token: ContextVar[str | None] = ContextVar("github_token", default=None)
_allowed_repositories: ContextVar[frozenset[str] | None] = ContextVar(
    "allowed_repositories",
    default=None,
)


def set_github_context(
    token: str,
    allowed_repositories: set[str] | None = None,
) -> tuple[Token[str | None], Token[frozenset[str] | None]]:
    return (
        _github_token.set(token),
        _allowed_repositories.set(
            None
            if allowed_repositories is None
            else frozenset(name.casefold() for name in allowed_repositories)
        ),
    )


def reset_github_context(
    tokens: tuple[Token[str | None], Token[frozenset[str] | None]],
) -> None:
    _github_token.reset(tokens[0])
    _allowed_repositories.reset(tokens[1])


class GithubAPIError(Exception):
    """Raised when GitHub API returns an error."""


class GithubClient:
    def __init__(self, access_token: str | None = None):
        token = access_token or _github_token.get()
        if not token:
            raise GithubAPIError("A connected GitHub account is required.")
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    @staticmethod
    def _check_repository_access(path: str) -> None:
        allowed = _allowed_repositories.get()
        if allowed is None:
            return
        parts = [unquote(part) for part in path.split("/") if part]
        if parts[:2] == ["user", "repos"]:
            raise GithubAPIError(
                "The agent may only access the repository selected for this run."
            )
        if len(parts) < 3 or parts[0] != "repos":
            return
        repository = f"{parts[1]}/{parts[2]}".casefold()
        if repository not in allowed:
            raise GithubAPIError(
                "The agent may only access the repository selected for this run."
            )

    async def get(
        self,
        path: str,
        params: dict[str, Any] | None = None,
    ) -> Any:
        self._check_repository_access(path)
        url = f"{settings.github_api_url}{path}"
        async with httpx.AsyncClient(timeout=30.0, headers=self.headers) as client:
            response = await client.get(url, params=params)
        if response.is_error:
            raise GithubAPIError(
                f"GitHub API error: {response.status_code} - {response.text}"
            )
        return response.json()

    async def post(self, path: str, json: dict[str, Any]) -> Any:
        self._check_repository_access(path)
        url = f"{settings.github_api_url}{path}"
        async with httpx.AsyncClient(timeout=30.0, headers=self.headers) as client:
            response = await client.post(url, json=json)
        if response.is_error:
            raise GithubAPIError(
                f"GitHub API error: {response.status_code} - {response.text}"
            )
        return response.json() if response.content else {}

    async def patch(self, path: str, json: dict[str, Any]) -> Any:
        self._check_repository_access(path)
        url = f"{settings.github_api_url}{path}"
        async with httpx.AsyncClient(timeout=30.0, headers=self.headers) as client:
            response = await client.patch(url, json=json)
        if response.is_error:
            raise GithubAPIError(
                f"GitHub API error: {response.status_code} - {response.text}"
            )
        return response.json() if response.content else {}

    async def put(self, path: str, json: dict[str, Any]) -> Any:
        self._check_repository_access(path)
        url = f"{settings.github_api_url}{path}"
        async with httpx.AsyncClient(timeout=30.0, headers=self.headers) as client:
            response = await client.put(url, json=json)
        if response.is_error:
            raise GithubAPIError(
                f"GitHub API error: {response.status_code} - {response.text}"
            )
        return response.json() if response.content else {}

    async def delete(
        self,
        path: str,
        json: dict[str, Any] | None = None,
    ) -> Any:
        self._check_repository_access(path)
        url = f"{settings.github_api_url}{path}"
        async with httpx.AsyncClient(timeout=30.0, headers=self.headers) as client:
            response = await client.request("DELETE", url, json=json)
        if response.is_error:
            raise GithubAPIError(
                f"GitHub API error: {response.status_code} - {response.text}"
            )
        return response.json() if response.content else {}
