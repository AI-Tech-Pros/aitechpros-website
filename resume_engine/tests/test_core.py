"""Unit tests for resume_engine core primitives."""

from __future__ import annotations

import json

import pytest

from resume_engine.core.checkpoint_store import ResumeEngine
from resume_engine.core.failure_classifier import (
    PartialStepError,
    PermanentStepError,
    TransientStepError,
    can_auto_resume,
    classify_failure,
    requires_compensation,
    requires_human_intervention,
)
from resume_engine.core.idempotency import (
    IdempotencyCollisionError,
    IdempotencyRegistry,
    generate_idempotency_key,
    hash_input,
)
from resume_engine.core.run import RunStatus
from resume_engine.core.step_record import FailureClassification, StepStatus
from resume_engine.storage.sqlite_backend import SQLiteCheckpointStore


class TestCheckpointPersistence:
    """Verify step checkpoints are written to durable storage."""

    def test_step_persisted_after_completion(self, engine: ResumeEngine) -> None:
        run = engine.start_run("test_workflow")

        def step_fn(inp: dict, key: str) -> dict:
            return {"result": inp["x"] * 2}

        record = engine.execute_step(
            run.run_id, "double", 0, {"x": 21}, step_fn
        )
        assert record.status == StepStatus.COMPLETED
        assert record.output_data == {"result": 42}

        loaded = engine.get_run_status(run.run_id)
        assert loaded is not None
        assert len(loaded.steps) == 1
        assert loaded.steps[0].output_data == {"result": 42}

    def test_input_hash_stored(self, engine: ResumeEngine) -> None:
        run = engine.start_run("hash_test")
        inp = {"query": "hello"}
        expected_hash = hash_input(inp)

        engine.execute_step(
            run.run_id,
            "s1",
            0,
            inp,
            lambda i, k: {"ok": True},
        )
        loaded = engine.get_run_status(run.run_id)
        assert loaded is not None
        assert loaded.steps[0].input_hash == expected_hash


class TestIdempotency:
    """Verify idempotency key generation and collision handling."""

    def test_same_inputs_produce_same_key(self) -> None:
        h = hash_input({"a": 1})
        k1 = generate_idempotency_key("run-1", "step", 0, h)
        k2 = generate_idempotency_key("run-1", "step", 0, h)
        assert k1 == k2

    def test_different_steps_produce_different_keys(self) -> None:
        h = hash_input({"a": 1})
        k1 = generate_idempotency_key("run-1", "step_a", 0, h)
        k2 = generate_idempotency_key("run-1", "step_b", 0, h)
        assert k1 != k2

    def test_collision_raises(self) -> None:
        registry = IdempotencyRegistry()
        registry.register("key-abc", "step_a")
        with pytest.raises(IdempotencyCollisionError):
            registry.register("key-abc", "step_b")

    def test_rerun_returns_cached_output(self, engine: ResumeEngine) -> None:
        run = engine.start_run("idem_test")
        call_count = 0

        def side_effect(inp: dict, key: str) -> dict:
            nonlocal call_count
            call_count += 1
            return {"calls": call_count}

        engine.execute_step(run.run_id, "s1", 0, {}, side_effect)
        engine.execute_step(run.run_id, "s1", 0, {}, side_effect)
        assert call_count == 1


class TestResume:
    """Verify resume from arbitrary failure points."""

    def test_resume_from_step_3_of_5(self, engine: ResumeEngine) -> None:
        run = engine.start_run("five_step")
        steps = [
            (f"step_{i}", lambda inp, key, n=i: {f"out_{n}": n})
            for i in range(5)
        ]

        # Run steps 0-2, fail at step 3
        for idx in range(3):
            engine.execute_step(
                run.run_id,
                steps[idx][0],
                idx,
                {},
                steps[idx][1],
            )

        with pytest.raises(TransientStepError):
            engine.execute_step(
                run.run_id,
                "step_3",
                3,
                {},
                lambda inp, key: (_ for _ in ()).throw(TransientStepError("fail")),
            )

        result = engine.resume(run.run_id, steps)
        assert result.status == RunStatus.COMPLETED
        completed = [s for s in result.steps if s.status == StepStatus.COMPLETED]
        assert len(completed) >= 5

    def test_resume_skips_completed_steps(self, engine: ResumeEngine) -> None:
        run = engine.start_run("skip_test")
        executed: list[int] = []

        def make_step(n: int):
            def fn(inp: dict, key: str) -> dict:
                executed.append(n)
                return {"n": n}
            return fn

        steps = [(f"s{i}", make_step(i)) for i in range(10)]

        for idx in range(7):
            engine.execute_step(run.run_id, steps[idx][0], idx, {}, steps[idx][1])

        with pytest.raises(TransientStepError):
            engine.execute_step(
                run.run_id,
                "s7",
                7,
                {},
                lambda inp, key: (_ for _ in ()).throw(TransientStepError("boom")),
            )

        executed.clear()
        engine.resume(run.run_id, steps)
        # Should only execute steps 7-9 (indices), not 0-6
        assert executed == [7, 8, 9]


class TestFailureClassification:
    """Verify all three failure classifications."""

    def test_transient(self) -> None:
        cls, msg = classify_failure(TransientStepError("timeout"))
        assert cls == FailureClassification.TRANSIENT
        assert can_auto_resume(cls)
        assert not requires_human_intervention(cls)

    def test_permanent(self) -> None:
        cls, msg = classify_failure(PermanentStepError("invalid config"))
        assert cls == FailureClassification.PERMANENT
        assert requires_human_intervention(cls)
        assert not can_auto_resume(cls)

    def test_partial(self) -> None:
        cls, msg = classify_failure(PartialStepError("email sent, db failed"))
        assert cls == FailureClassification.PARTIAL
        assert requires_compensation(cls)
        assert not can_auto_resume(cls)

    def test_connection_error_is_transient(self) -> None:
        cls, _ = classify_failure(ConnectionError("refused"))
        assert cls == FailureClassification.TRANSIENT


class TestDeterministicReplay:
    """Verify audit log replay produces identical traces."""

    def test_replay_produces_matching_outputs(self, engine: ResumeEngine) -> None:
        steps = [
            ("a", lambda inp, key: {"a": 1}),
            ("b", lambda inp, key: {"b": inp.get("a", 0) + 1}),
            ("c", lambda inp, key: {"c": "done"}),
        ]

        run1 = engine.start_run("replay_test")
        engine.execute_workflow(run1.run_id, steps)
        trace1 = engine.get_audit_log(run1.run_id)

        run2 = engine.start_run("replay_test")
        engine.execute_workflow(run2.run_id, steps)
        trace2 = engine.get_audit_log(run2.run_id)

        def normalized_step_lines(trace: str) -> list[str]:
            lines: list[str] = []
            for line in trace.split("\n"):
                if not line.startswith("{"):
                    continue
                payload = json.loads(line)
                payload.pop("idempotency_key", None)
                lines.append(json.dumps(payload, sort_keys=True, separators=(",", ":")))
            return lines

        assert normalized_step_lines(trace1) == normalized_step_lines(trace2)
