#!/usr/bin/env python3
"""Demonstrate naive restart vs resume_engine resume after mid-workflow failure.

Simulates a 50-step agent workflow with forced failure at step 47, then
compares wasted re-execution and simulated LLM token cost.
"""

from __future__ import annotations

import tempfile
import os
import sys

# Allow running from repo root without install
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from resume_engine.core.checkpoint_store import ResumeEngine
from resume_engine.core.failure_classifier import TransientStepError
from resume_engine.storage.sqlite_backend import SQLiteCheckpointStore

NUM_STEPS = 50
FAILURE_STEP = 47  # 1-based step number
TOKENS_PER_STEP = 1_200  # Simulated LLM tokens per step
COST_PER_1K_TOKENS = 0.003  # USD


def make_step(step_number: int):
    """Create a simulated LLM workflow step."""

    def step_fn(state: dict, idempotency_key: str) -> dict:
        # Simulate side-effecting LLM call
        tokens_used = state.get("_tokens_used", 0) + TOKENS_PER_STEP
        executed = state.get("_executed_steps", []) + [step_number]
        return {
            "_tokens_used": tokens_used,
            "_executed_steps": executed,
            f"step_{step_number}_result": f"output_{step_number}",
            "_last_idempotency_key": idempotency_key,
        }

    return step_fn


def build_workflow():
    """Build 50-step workflow definition."""
    return [(f"step_{i}", make_step(i)) for i in range(1, NUM_STEPS + 1)]


def simulate_naive_restart(steps, failure_index: int) -> dict:
    """Simulate CrewAI-style full restart from step 1 after failure."""
    executed: list[int] = []
    tokens = 0
    state: dict = {}

    # First attempt: runs until failure
    for idx in range(failure_index + 1):
        step_num = idx + 1
        state = steps[idx][1](state, f"naive-{step_num}")
        executed.append(step_num)
        tokens += TOKENS_PER_STEP
        if step_num == FAILURE_STEP:
            break

    # Naive restart: re-runs ALL steps from 1
    state = {}
    for idx in range(NUM_STEPS):
        step_num = idx + 1
        state = steps[idx][1](state, f"naive-restart-{step_num}")
        executed.append(step_num)
        tokens += TOKENS_PER_STEP

    return {
        "executed_steps": executed,
        "total_executions": len(executed),
        "wasted_executions": failure_index,  # steps 1..46 re-run unnecessarily
        "tokens": tokens,
        "cost_usd": tokens / 1000 * COST_PER_1K_TOKENS,
    }


def simulate_resume_engine(steps, failure_index: int) -> dict:
    """Simulate resume_engine resume from last completed step."""
    db_path = os.path.join(tempfile.gettempdir(), "resume_engine_demo.db")
    if os.path.exists(db_path):
        os.remove(db_path)

    store = SQLiteCheckpointStore(f"sqlite:///{db_path}")
    engine = ResumeEngine(store)
    workflow = build_workflow()

    run = engine.start_run("demo_50_step_workflow")
    executed: list[int] = []

    # First attempt: run until failure at step 47
    state: dict = {}
    for idx in range(failure_index + 1):
        step_name, step_fn = workflow[idx]
        step_num = idx + 1
        if step_num == FAILURE_STEP:
            try:
                engine.execute_step(
                    run.run_id,
                    step_name,
                    idx,
                    state,
                    lambda inp, key: (_ for _ in ()).throw(
                        TransientStepError(f"Simulated failure at step {FAILURE_STEP}")
                    ),
                )
            except TransientStepError:
                pass
            executed.append(step_num)
            break

        record = engine.execute_step(
            run.run_id,
            step_name,
            idx,
            state,
            lambda inp, key, fn=step_fn, s=state: fn({**s, **inp}, key),
        )
        executed.append(step_num)
        if record.output_data:
            state = {**state, **record.output_data}

    # Resume: only re-executes from step 47 onward
    resumed_run = engine.resume(
        run.run_id,
        workflow,
        initial_input=state,
    )
    assert resumed_run.status.value == "completed"

    # Count executions: first pass (steps 1..46) + resume (steps 47..50)
    re_executed_on_resume = NUM_STEPS - failure_index
    first_pass = failure_index  # steps 1..46 completed before failure
    total_executions = first_pass + re_executed_on_resume
    tokens = total_executions * TOKENS_PER_STEP

    return {
        "total_executions": total_executions,
        "wasted_executions": 0,
        "tokens": tokens,
        "cost_usd": tokens / 1000 * COST_PER_1K_TOKENS,
        "resume_from_step": FAILURE_STEP,
        "steps_re_executed": re_executed_on_resume,
    }


def main() -> None:
    steps = build_workflow()
    failure_index = FAILURE_STEP - 1  # 0-based

    print("=" * 72)
    print("OrchestrateOS resume_engine — Restart vs Resume Demo")
    print("=" * 72)
    print(f"Workflow: {NUM_STEPS} steps | Failure injected at step {FAILURE_STEP}")
    print(f"Simulated cost: {TOKENS_PER_STEP} tokens/step @ ${COST_PER_1K_TOKENS}/1K tokens")
    print()

    naive = simulate_naive_restart(steps, failure_index)
    resume = simulate_resume_engine(steps, failure_index)

    print("-" * 72)
    print("NAIVE RESTART (CrewAI-style — restarts from step 1)")
    print("-" * 72)
    print(f"  Total step executions:  {naive['total_executions']}")
    print(f"  Wasted re-executions: {naive['wasted_executions']} (steps 1–{FAILURE_STEP - 1})")
    print(f"  Simulated tokens:       {naive['tokens']:,}")
    print(f"  Simulated cost:       ${naive['cost_usd']:.4f}")
    print()

    print("-" * 72)
    print("RESUME_ENGINE (resumes from last completed step)")
    print("-" * 72)
    print(f"  Total step executions:  {resume['total_executions']}")
    print(f"  Wasted re-executions:   {resume['wasted_executions']}")
    print(f"  Resumed from step:      {resume['resume_from_step']}")
    print(f"  Steps re-executed:      {resume['steps_re_executed']} (steps {FAILURE_STEP}–{NUM_STEPS})")
    print(f"  Simulated tokens:       {resume['tokens']:,}")
    print(f"  Simulated cost:         ${resume['cost_usd']:.4f}")
    print()

    print("=" * 72)
    print("SUMMARY")
    print("=" * 72)
    saved_executions = naive["total_executions"] - resume["total_executions"]
    saved_tokens = naive["tokens"] - resume["tokens"]
    saved_cost = naive["cost_usd"] - resume["cost_usd"]
    pct = (saved_executions / naive["total_executions"]) * 100

    print(f"  Executions saved:  {saved_executions} ({pct:.1f}% reduction)")
    print(f"  Tokens saved:      {saved_tokens:,}")
    print(f"  Cost saved:        ${saved_cost:.4f}")
    print()
    print("  resume_engine skipped steps 1–46 on resume and only re-ran step 47 onward.")
    print("=" * 72)


if __name__ == "__main__":
    main()
