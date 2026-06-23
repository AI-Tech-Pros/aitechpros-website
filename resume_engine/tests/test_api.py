"""API integration tests for the FastAPI control plane."""

from __future__ import annotations

import os
import tempfile

import pytest
from fastapi.testclient import TestClient

from resume_engine.api.config import Settings
from resume_engine.api.main import create_app


@pytest.fixture
def client() -> TestClient:
    db = os.path.join(tempfile.gettempdir(), f"test_api_{os.getpid()}_{id(tempfile)}.db")
    if os.path.exists(db):
        os.remove(db)

    app = create_app(
        Settings(
            database_url=f"sqlite:///{db}",
            host="127.0.0.1",
            port=8000,
            log_level="warning",
        )
    )
    with TestClient(app) as test_client:
        yield test_client

    if os.path.exists(db):
        os.remove(db)


def test_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_start_run_and_status(client: TestClient) -> None:
    start = client.post("/start_run", json={"workflow_name": "api_test"})
    assert start.status_code == 200
    body = start.json()
    assert body["status"] == "running"
    run_id = body["run_id"]

    status = client.get(f"/runs/{run_id}/status")
    assert status.status_code == 200
    assert status.json()["workflow_name"] == "api_test"
    assert status.json()["steps_completed"] == 0


def test_resume_metadata(client: TestClient) -> None:
    start = client.post("/start_run", json={"workflow_name": "resume_meta"})
    run_id = start.json()["run_id"]

    resume = client.post("/resume", json={"run_id": run_id})
    assert resume.status_code == 200
    assert resume.json()["resume_from_index"] == 0


def test_audit_log_empty_run(client: TestClient) -> None:
    start = client.post("/start_run", json={"workflow_name": "audit"})
    run_id = start.json()["run_id"]

    audit = client.get(f"/runs/{run_id}/audit_log")
    assert audit.status_code == 200
    assert run_id in audit.json()["audit_trace"]


def test_not_found(client: TestClient) -> None:
    response = client.get("/runs/does-not-exist/status")
    assert response.status_code == 404


def test_resume_blockers_empty_on_new_run(client: TestClient) -> None:
    start = client.post("/start_run", json={"workflow_name": "blockers"})
    run_id = start.json()["run_id"]

    blockers = client.get(f"/runs/{run_id}/resume_blockers")
    assert blockers.status_code == 200
    assert blockers.json()["can_resume"] is True


def test_approve_endpoint(client: TestClient) -> None:
    start = client.post("/start_run", json={"workflow_name": "approve"})
    run_id = start.json()["run_id"]

    response = client.post(
        f"/runs/{run_id}/approve",
        json={"approved_by": "ops@aitechpros.ai", "note": "fixed credentials"},
    )
    assert response.status_code == 400
