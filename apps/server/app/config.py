"""Settings from the environment (or .env). Defaults work for local dev against `docker compose up db redis`."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

REPO = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://app:app@localhost:5432/app"
    db_pool_size: int = 10
    redis_url: str | None = None  # unset: rate limits are per process (fine for one worker)
    cors_origins: str = "*"
    google_client_ids: str = ""  # comma-separated; empty turns Google sign-in off
    admin_token: str | None = None
    session_days: int = 180
    embed_model: str = "BAAI/bge-small-en-v1.5"  # 384 dimensions; changing it means a migration and re-ingest
    embed_model_path: str | None = None  # a folder with the model files, for servers without internet (else downloaded once)
    unrot_catalog: Path = REPO / "packages" / "unrot-content" / "cards.json"
    testing: bool = False  # no connection pooling, so each test's event loop gets fresh connections

    @property
    def google_ids(self) -> list[str]:
        return [x.strip() for x in self.google_client_ids.split(",") if x.strip()]


@lru_cache
def settings() -> Settings:
    return Settings()
