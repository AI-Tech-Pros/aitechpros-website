"""Adapter smoke tests (optional deps skipped when not installed)."""

from __future__ import annotations

import importlib.util

import pytest

from resume_engine.core.checkpoint_store import ResumeEngine


def _package_available(name: str) -> bool:
    return importlib.util.find_spec(name) is not None


@pytest.mark.skipif(not _package_available("langgraph"), reason="langgraph not installed")
def test_langgraph_adapter_wraps_node(engine: ResumeEngine) -> None:
    from resume_engine.adapters.langgraph_adapter import wrap_langgraph_node

    run = engine.start_run("lg_test")

    def research_node(state: dict) -> dict:
        return {"findings": f"result for {state.get('query', '')}"}

    wrapped = wrap_langgraph_node(engine, run.run_id, "research", 0, research_node)
    out = wrapped({"query": "hello"})
    assert "findings" in out
    assert out["query"] == "hello"

    status = engine.get_run_status(run.run_id)
    assert status is not None
    assert len(status.steps) == 1


@pytest.mark.skipif(not _package_available("crewai"), reason="crewai not installed")
def test_crewai_adapter_wraps_task(engine: ResumeEngine) -> None:
    from resume_engine.adapters.crewai_adapter import wrap_crewai_task

    run = engine.start_run("crew_test")

    def ingest(state: dict) -> dict:
        return {"raw": state["url"]}

    wrapped = wrap_crewai_task(engine, run.run_id, "ingest", 0, ingest)
    out = wrapped({"url": "https://example.com"})
    assert out["raw"] == "https://example.com"


def test_durable_step_decorator(engine: ResumeEngine) -> None:
    from resume_engine.adapters.decorator import durable_step

    run = engine.start_run("decorator_test")

    @durable_step(engine, run.run_id, "double", 0)
    def double(state: dict) -> dict:
        return {"value": state["n"] * 2}

    result = double.execute({"n": 21})
    assert result["value"] == 42
