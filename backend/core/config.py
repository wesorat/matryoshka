from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).parent.parent.parent
FILES_DIR = Path(__file__).parent.parent
DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173,"
    "http://127.0.0.1:5173,"
    "http://localhost:3000,"
    "http://127.0.0.1:3000"
)
MIN_SECRET_LENGTH = 32


class Settings(BaseSettings):
    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: str
    DB_DATABASE: str
    DEBUG: bool
    SECRET: str
    CORS_ORIGINS: str = DEFAULT_CORS_ORIGINS
    UPLOAD_DIR: str | None = None

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def DB_URL(self):
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_DATABASE}"

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]

    @model_validator(mode="after")
    def validate_production_settings(self):
        if not self.DEBUG:
            secret = self.SECRET.strip()
            if (
                not secret
                or secret == "change-me"
                or len(secret) < MIN_SECRET_LENGTH
            ):
                raise ValueError(
                    "SECRET must be a strong value of at least "
                    f"{MIN_SECRET_LENGTH} characters when DEBUG=False."
                )
            if "*" in self.cors_origins:
                raise ValueError(
                    "CORS_ORIGINS cannot contain '*' when DEBUG=False; "
                    "set explicit origins when credentials are enabled."
                )
        return self


settings = Settings()
