"""Runtime configuration for the OrchestrateOS API service."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    """Environment-backed settings for the FastAPI control plane."""

    database_url: str
    host: str
    port: int
    log_level: str

    @classmethod
    def from_env(cls) -> Settings:
        """Load settings from environment variables."""
        return cls(
            database_url=os.environ.get(
                "DATABASE_URL",
                "sqlite:///./resume_engine_api.db",
            ),
            host=os.environ.get("HOST", "0.0.0.0"),
            port=int(os.environ.get("PORT", "8000")),
            log_level=os.environ.get("LOG_LEVEL", "info"),
        )
