"""Shared pytest fixtures for resume_engine tests."""

from __future__ import annotations

import pytest

from resume_engine.core.checkpoint_store import ResumeEngine
from resume_engine.storage.sqlite_backend import SQLiteCheckpointStore


@pytest.fixture
def engine() -> ResumeEngine:
    """Fresh in-memory SQLite engine for each test."""
    store = SQLiteCheckpointStore("sqlite:///:memory:")
    yield ResumeEngine(store)
    store.close()
