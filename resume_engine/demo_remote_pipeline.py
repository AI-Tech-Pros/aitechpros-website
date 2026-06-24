#!/usr/bin/env python3
"""Run a workflow against the live OrchestrateOS control plane (Worker + D1).

Requires: pip install -e ".[remote]"

Environment:
  ORCHESTRATEOS_API_URL — default https://orchestrateos-api.nevaquit.workers.dev

After a transient failure at step 7, prints the run ID for lookup in the gate explorer:
  https://orchestrateos.pages.dev/#gates
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from resume_engine.core.checkpoint_store import ResumeEngine
from resume_engine.core.failure_classifier import TransientStepError
from resume_engine.storage.remote_backend import RemoteCheckpointStore

DEFAULT_API_URL = "https://orchestrateos-api.nevaquit.workers.dev"
NUM_STEPS = 10
FAILURE_STEP = 7  # 1-based


def build_workflow() -> list[tuple[str, object]]:
    def make_step(n: int):
        def step_fn(state: dict, idempotency_key: str) -> dict:
            return {**state, f"step_{n}": f"ok_{n}", "_last_key": idempotency_key}

        return step_fn

    return [(f"step_{i}", make_step(i)) for i in range(1, NUM_STEPS + 1)]


def main() -> None:
    api_url = os.environ.get("ORCHESTRATEOS_API_URL", DEFAULT_API_URL).rstrip("/")
    gate_url = "https://orchestrateos.pages.dev/#gates"

    print("=" * 72)
    print("OrchestrateOS — Remote pipeline demo (Python SDK → Worker + D1)")
    print("=" * 72)
    print(f"API: {api_url}")
    print(f"Gate explorer: {gate_url}")
    print()

    workflow = build_workflow()
    failure_index = FAILURE_STEP - 1

    with RemoteCheckpointStore(api_url) as store:
        engine = ResumeEngine(store)
        run = engine.start_run(
            "remote_demo_pipeline",
            metadata={"demo": "phase2", "failure_at": FAILURE_STEP},
        )
        print(f"Started run: {run.run_id}")
        print()

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
                            TransientStepError(f"Injected transient failure at step {FAILURE_STEP}")
                        ),
                    )
                except TransientStepError:
                    print(f"Step {FAILURE_STEP} failed (transient) — run checkpointed remotely.")
                break

            record = engine.execute_step(
                run.run_id,
                step_name,
                idx,
                state,
                lambda inp, key, fn=step_fn, s=state: fn({**s, **inp}, key),
            )
            if record.output_data:
                state = {**state, **record.output_data}
            print(f"  Completed step {step_num}/{NUM_STEPS}")

        print()
        print("Resuming from last completed step...")
        final = engine.resume(run.run_id, workflow, initial_input=state)
        print(f"Final status: {final.status.value}")
        print(f"Steps recorded: {len(final.steps)}")
        print()
        print("-" * 72)
        print("Look up this run in the gate explorer (Live API tab):")
        print(f"  {gate_url}")
        print(f"  Run ID: {run.run_id}")
        print("-" * 72)


if __name__ == "__main__":
    main()
