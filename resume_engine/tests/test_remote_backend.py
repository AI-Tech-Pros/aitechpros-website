"""Tests for RemoteCheckpointStore against a mocked Worker API."""

from __future__ import annotations

import json

import httpx
import pytest

from resume_engine.core.checkpoint_store import ResumeEngine
from resume_engine.core.failure_classifier import TransientStepError
from resume_engine.core.run import Run, RunStatus
from resume_engine.core.step_record import StepRecord, StepStatus
from resume_engine.storage.remote_backend import RemoteCheckpointStore


class MockWorker:
    """In-memory state mimicking Worker + D1 for httpx MockTransport."""

    def __init__(self) -> None:
        self.runs: dict[str, dict] = {}
        self.steps: dict[str, list[dict]] = {}

    def handler(self, request: httpx.Request) -> httpx.Response:
        path = request.url.path
        method = request.method

        if method == "POST" and path == "/start_run":
            body = json.loads(request.content)
            run_id = body["run_id"]
            if run_id in self.runs:
                return httpx.Response(409, json={"detail": f"Run already exists: {run_id}"})
            self.runs[run_id] = {
                "run_id": run_id,
                "workflow_name": body["workflow_name"],
                "status": "running",
                "created_at": "2026-01-01T00:00:00+00:00",
                "updated_at": "2026-01-01T00:00:00+00:00",
                "metadata": body.get("metadata", {}),
            }
            self.steps[run_id] = []
            return httpx.Response(200, json={"run_id": run_id, "status": "running"})

        if method == "GET" and path.startswith("/runs/") and path.count("/") == 2:
            run_id = path.split("/")[-1]
            run = self.runs.get(run_id)
            if not run:
                return httpx.Response(404, json={"detail": "not found"})
            return httpx.Response(200, json={**run, "steps": self.steps.get(run_id, [])})

        if method == "PATCH" and path.startswith("/runs/"):
            run_id = path.split("/")[-1]
            run = self.runs.get(run_id)
            if not run:
                return httpx.Response(404, json={"detail": "not found"})
            body = json.loads(request.content)
            if "status" in body:
                run["status"] = body["status"]
            if "metadata" in body:
                run["metadata"] = body["metadata"]
            return httpx.Response(200, json={**run, "steps": self.steps.get(run_id, [])})

        if method == "POST" and "/steps" in path:
            run_id = path.split("/")[2]
            if run_id not in self.runs:
                return httpx.Response(404, json={"detail": "not found"})
            body = json.loads(request.content)
            step = {
                "step_name": body["step_name"],
                "step_index": body["step_index"],
                "input_data": body.get("input_json", {}),
                "input_hash": "mock",
                "output_data": body.get("output_json"),
                "status": body["status"],
                "idempotency_key": body["idempotency_key"],
                "timestamp": "2026-01-01T00:00:00+00:00",
                "failure_classification": body.get("failure_classification"),
                "error_message": body.get("error_message"),
                "sequence": body.get("sequence", len(self.steps[run_id])),
            }
            self.steps[run_id].append(step)
            if body["status"] == "failed":
                self.runs[run_id]["status"] = "failed"
            return httpx.Response(201, json={"run_id": run_id})

        if method == "GET" and path.startswith("/idempotency/"):
            key = path.split("/idempotency/", 1)[1]
            for steps in self.steps.values():
                for step in reversed(steps):
                    if (
                        step["idempotency_key"] == key
                        and step["status"] in ("completed", "skipped_replay")
                    ):
                        return httpx.Response(200, json=step)
            return httpx.Response(404, json={"detail": "not found"})

        return httpx.Response(404, json={"detail": f"unhandled {method} {path}"})


@pytest.fixture
def remote_engine() -> ResumeEngine:
    mock = MockWorker()
    transport = httpx.MockTransport(mock.handler)
    client = httpx.Client(transport=transport, base_url="https://mock.test")
    store = RemoteCheckpointStore("https://mock.test")
    store._client = client
    yield ResumeEngine(store)
    store.close()


class TestRemoteCheckpointStore:
    def test_create_and_get_run(self, remote_engine: ResumeEngine) -> None:
        run = remote_engine.start_run("remote_workflow", metadata={"source": "test"})
        loaded = remote_engine.get_run_status(run.run_id)
        assert loaded is not None
        assert loaded.workflow_name == "remote_workflow"
        assert loaded.metadata["source"] == "test"

    def test_step_persisted_remotely(self, remote_engine: ResumeEngine) -> None:
        run = remote_engine.start_run("step_test")
        remote_engine.execute_step(
            run.run_id,
            "double",
            0,
            {"x": 3},
            lambda inp, key: {"result": inp["x"] * 2},
        )
        loaded = remote_engine.get_run_status(run.run_id)
        assert loaded is not None
        assert len(loaded.steps) == 1
        assert loaded.steps[0].output_data == {"result": 6}

    def test_idempotent_skip_via_remote(self, remote_engine: ResumeEngine) -> None:
        run = remote_engine.start_run("idem_test")
        fn = lambda inp, key: {"v": 1}
        first = remote_engine.execute_step(run.run_id, "s1", 0, {}, fn)
        second = remote_engine.execute_step(run.run_id, "s1", 0, {}, fn)
        assert first.idempotency_key == second.idempotency_key
        loaded = remote_engine.get_run_status(run.run_id)
        assert loaded is not None
        assert len(loaded.steps) == 1

    def test_failure_and_resume_transient(self, remote_engine: ResumeEngine) -> None:
        run = remote_engine.start_run("fail_resume")
        steps = [
            ("s1", lambda inp, key: {"n": 1}),
            ("s2", lambda inp, key: {"n": 2}),
        ]

        remote_engine.execute_step(run.run_id, "s1", 0, {}, steps[0][1])
        try:
            remote_engine.execute_step(
                run.run_id,
                "s2",
                1,
                {"n": 1},
                lambda inp, key: (_ for _ in ()).throw(
                    TransientStepError("simulated transient")
                ),
            )
        except TransientStepError:
            pass

        resumed = remote_engine.resume(run.run_id, steps, initial_input={"n": 1})
        assert resumed.status == RunStatus.COMPLETED
        assert len(resumed.steps) == 3  # s1 ok, s2 failed, s2 retried on resume
