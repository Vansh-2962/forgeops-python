from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "GitHub AI Agent"
    environment: str = "development"
    github_api_url: str = "https://api.github.com"
    github_oauth_client_id: str | None = None
    github_oauth_client_secret: str | None = None
    github_oauth_callback_url: str | None = None
    groq_api_key: str = Field(...)
    groq_model: str = "openai/gpt-oss-20b"
    database_url: str = Field(...)
    frontend_origins: str = ""
    frontend_url: str = "http://localhost:5173"
    better_auth_secret: str = Field(...)
    google_client_id: str | None = None
    google_client_secret: str | None = None
    google_callback_url: str | None = None
    session_cookie_name: str = "forgeops_session"
    session_max_age_days: int = 14
    session_cookie_secure: bool | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()