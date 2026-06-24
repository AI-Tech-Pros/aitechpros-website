"""LangGraph + RemoteCheckpointStore quickstart (design partner).

Requires: pip install "resume_engine[remote,langgraph]"
"""

from __future__ import annotations

import os

from resume_engine import ResumeEngine
from resume_engine.remote import RemoteCheckpointStore

API_URL = os.environ.get("ORCHESTRATEOS_API_URL", "https://orchestrateos-api.nevaquit.workers.dev")
API_KEY = os.environ.get("ORCHESTRATEOS_API_KEY", "")


def main() -> None:
    if not API_KEY:
        raise SystemExit("Set ORCHESTRATEOS_API_KEY to your tenant runner key")

    store = RemoteCheckpointStore(base_url=API_URL, api_key=API_KEY)
    engine = ResumeEngine(store)
    run = engine.start_run("langgraph_pilot", environment="staging")
    print("Started run", run.run_id)
    print("Wire your LangGraph node wrapper — see resume_engine.langgraph")


if __name__ == "__main__":
    main()
