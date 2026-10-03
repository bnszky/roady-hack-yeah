from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment / .env (pydantic-settings)."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    app_name: str = "Colortrail API"
    app_version: str = "0.1.0"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # Logging (level TBD — tune later)
    log_level: str = "INFO"

    # Auth (set false to skip JWT validation while prototyping)
    auth_required: bool = True

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # Groq (LLM for the voice assistant)
    groq_api_key: str = ""

    # Database (direct Postgres connection)
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:54322/postgres"

    # CORS (JSON array of origins)
    cors_origins: list[str] = ["*"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
