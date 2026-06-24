#!/usr/bin/env python3
"""Design partner starter — plain Python workflow on the live control plane.

Simulates a partial failure (side effect + DB write), records compensation, resumes.

Requires:
  pip install "resume_engine[remote]"

Environment:
  ORCHESTRATEOS_API_URL  — default production Worker URL
  ORCHESTRATEOS_API_KEY  — runner role (required when auth enabled)

Operator clears gates via API or gate explorer for demo runs only.
For partner runs, use operator key + POST /runs/{id}/compensate (or record_compensation below).
"""

from __future__ import annotations

import os

from resume_engine.core.checkpoint_store import ResumeEngine
from resume_engine.core.failure_classifier import PartialStepError
from resume_engine.storage.remote_backend import RemoteCheckpointStore

DEFAULT_API = "https://orchestrateos-api.nevaquit.workers.dev"
GATES_URL = "https://orchestrateos.pages.dev/#gates"


def main() -> None:
    api = os.environ.get("ORCHESTRATEOS_API_URL", DEFAULT_API).rstrip("/")
    api_key = os.environ.get("ORCHESTRATEOS_API_KEY")
    if not api_key:
        raise SystemExit("Set ORCHESTRATEOS_API_KEY (runner role) before running.")

    print(f"API: {api}")
    print(f"Gate explorer: {GATES_URL}")
    print()

    steps = [
        ("ingest", 0, lambda s, _: {**s, "doc_id": "doc-100"}),
        ("enrich", 1, lambda s, _: {**s, "entities": ["Acme Corp"]}),
        ("notify", 2, lambda s, _: {**s, "email_sent": True}),
        ("persist", 3, lambda s, _: (_ for _ in ()).throw(PartialStepError("DB write failed after email"))),
        ("finalize", 4, lambda s, _: {**s, "status": "done"}),
    ]

    with RemoteCheckpointStore(api, api_key=api_key) as store:
        engine = ResumeEngine(store)
        run = engine.start_run(
            "partner_pilot_pipeline",
            metadata={"pilot": True, "partner": "replace-me"},
        )
        print(f"Started run: {run.run_id}")

        state: dict = {}
        for name, index, fn in steps:
            try:
                record = engine.execute_step(run.run_id, name, index, state, fn)
                if record.output_data:
                    state = {**state, **record.output_data}
                print(f"  OK  {name}")
            except PartialStepError as exc:
                print(f"  FAIL {name}: {exc}")
                break

        blockers = engine.get_resume_blockers(run.run_id)
        if blockers:
            print(f"\nBlocked ({len(blockers)} gate(s)) — recording compensation...")
            engine.record_compensation(
                run.run_id,
                result={"reverted_email_id": "undo-doc-100"},
                note="partner pilot — compensation script",
            )

        print("\nResuming...")
        final = engine.resume(run.run_id, [(n, i, f) for n, i, f in steps], initial_input=state)
        print(f"Final status: {final.status.value}")
        print(f"Steps: {len(final.steps)}")
        print()
        print("-" * 72)
        print(f"Run ID (share with ops / gate explorer): {run.run_id}")
        print(f"Audit: GET {api}/runs/{run.run_id}/audit_events")
        print("-" * 72)


if __name__ == "__main__":
    main()
