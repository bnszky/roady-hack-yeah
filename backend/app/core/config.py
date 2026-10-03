from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment / .env (pydantic-settings)."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    app_name: str = "Routy API"
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

    # Database (direct Postgres connection)
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:54322/postgres"

    # CORS (JSON array of origins)
    cors_origins: list[str] = ["*"]

    # Problems
    # New reports of the same category within this radius are attached to an existing problem.
    problem_dedupe_radius_m: float = 30.0
    # A problem stops being observable after this many "NO" answers since the last "YES".
    problem_denial_threshold: int = 3
    nearby_default_radius_m: float = 50.0
    route_default_buffer_m: float = 30.0

    # Routing (OSRM-compatible API; FOSSGIS server has a dedicated walking instance)
    osrm_base_url: str = "https://routing.openstreetmap.de/routed-foot"
    osrm_profile: str = "foot"
    osrm_timeout_s: float = 15.0

    # Assistant (DeepSeek, OpenAI-compatible chat completions)
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-flash"
    deepseek_timeout_s: float = 30.0


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
