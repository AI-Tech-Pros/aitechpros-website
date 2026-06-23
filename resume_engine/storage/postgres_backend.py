"""Postgres-backed checkpoint store for production deployments."""

from __future__ import annotations

from resume_engine.storage.sqlite_backend import SQLiteCheckpointStore


class PostgresCheckpointStore(SQLiteCheckpointStore):
  """Durable checkpoint storage using PostgreSQL via SQLAlchemy.

  Inherits all persistence logic from SQLiteCheckpointStore since both use
  the same SQLAlchemy models; only the connection URL differs.

  Example:
      store = PostgresCheckpointStore(
          "postgresql+psycopg2://user:pass@host:5432/resume_engine"
      )
  """

  def __init__(self, database_url: str) -> None:
      if not database_url.startswith("postgresql"):
          raise ValueError(
              "PostgresCheckpointStore requires a postgresql:// or "
              "postgresql+psycopg2:// database URL"
          )
      super().__init__(database_url=database_url)
