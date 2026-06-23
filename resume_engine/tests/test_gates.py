"""Resume gate tests — compensation and human approval."""

from __future__ import annotations

import pytest

from resume_engine.core.checkpoint_store import ResumeEngine
from resume_engine.core.failure_classifier import PartialStepError, PermanentStepError
from resume_engine.core.resume_gates import ResumeBlockedError
from resume_engine.core.run import RunStatus


def _steps(count: int = 5):
    return [(f"s{i}", lambda inp, key, n=i: {f"out_{n}": n}) for i in range(count)]


class TestPartialFailureGate:
    def test_resume_blocked_until_compensation(self, engine: ResumeEngine) -> None:
        run = engine.start_run("partial_gate")
        steps = _steps(5)

        for idx in range(3):
            engine.execute_step(run.run_id, steps[idx][0], idx, {}, steps[idx][1])

        with pytest.raises(PartialStepError):
            engine.execute_step(
                run.run_id,
                "s3",
                3,
                {},
                lambda inp, key: (_ for _ in ()).throw(
                    PartialStepError("email sent, db write failed")
                ),
            )

        blockers = engine.get_resume_blockers(run.run_id)
        assert len(blockers) == 1
        assert blockers[0].required_action == "compensation"

        with pytest.raises(ResumeBlockedError):
            engine.resume(run.run_id, steps)

        engine.execute_compensation(
            run.run_id,
            lambda inp, key: {"compensated": True, "reverted_email": True},
        )

        assert engine.get_resume_blockers(run.run_id) == []
        result = engine.resume(run.run_id, steps)
        assert result.status == RunStatus.COMPLETED

    def test_record_compensation_via_api_path(self, engine: ResumeEngine) -> None:
        run = engine.start_run("partial_record")
        steps = _steps(3)

        with pytest.raises(PartialStepError):
            engine.execute_step(
                run.run_id,
                "s0",
                0,
                {},
                lambda inp, key: (_ for _ in ()).throw(PartialStepError("partial")),
            )

        engine.record_compensation(run.run_id, result={"ok": True}, note="ops ticket 42")
        assert engine.get_resume_blockers(run.run_id) == []


class TestPermanentFailureGate:
    def test_resume_blocked_until_human_approval(self, engine: ResumeEngine) -> None:
        run = engine.start_run("permanent_gate")
        steps = _steps(4)

        engine.execute_step(run.run_id, "s0", 0, {}, steps[0][1])
        engine.execute_step(run.run_id, "s1", 1, {}, steps[1][1])

        with pytest.raises(PermanentStepError):
            engine.execute_step(
                run.run_id,
                "s2",
                2,
                {},
                lambda inp, key: (_ for _ in ()).throw(
                    PermanentStepError("invalid API credentials")
                ),
            )

        blockers = engine.get_resume_blockers(run.run_id)
        assert len(blockers) == 1
        assert blockers[0].required_action == "human_approval"

        with pytest.raises(ResumeBlockedError):
            engine.resume(run.run_id, steps)

        engine.grant_human_approval(run.run_id, "ops@aitechpros.ai", note="rotated API key")

        assert engine.get_resume_blockers(run.run_id) == []
        paused = engine.get_run_status(run.run_id)
        assert paused is not None
        assert paused.status == RunStatus.PAUSED

        result = engine.resume(run.run_id, steps)
        assert result.status == RunStatus.COMPLETED

    def test_approval_does_not_carry_to_new_failure(self, engine: ResumeEngine) -> None:
        run = engine.start_run("re_failure")
        attempts = {"s1": 0}

        def step_s1(inp: dict, key: str) -> dict:
            attempts["s1"] += 1
            if attempts["s1"] == 1:
                raise PermanentStepError("bad config")
            return {"ok": True}

        steps = [
            ("s0", lambda inp, key: {"ok": True}),
            ("s1", step_s1),
        ]

        with pytest.raises(PermanentStepError):
            engine.execute_workflow(run.run_id, steps)

        engine.grant_human_approval(run.run_id, "admin@corp.com")
        engine.resume(run.run_id, steps)

        with pytest.raises(PermanentStepError):
            engine.execute_step(
                run.run_id,
                "s2",
                2,
                {},
                lambda inp, key: (_ for _ in ()).throw(PermanentStepError("new failure")),
            )

        assert len(engine.get_resume_blockers(run.run_id)) == 1
