"""LangGraph node wrapper for checkpoint-after-every-node execution."""

from __future__ import annotations

from typing import Any, Callable

from resume_engine.core.checkpoint_store import ResumeEngine


def wrap_langgraph_node(
    engine: ResumeEngine,
    run_id: str,
    step_name: str,
    step_index: int,
    node_fn: Callable[[dict[str, Any]], dict[str, Any]],
) -> Callable[[dict[str, Any]], dict[str, Any]]:
  """Wrap a LangGraph node function with durable checkpointing.

  Drop-in replacement: pass the wrapped function to ``add_node`` instead of
  the raw node function. No changes to graph topology are required.

  Example:
      def research_node(state: dict) -> dict:
          return {"findings": llm.invoke(state["query"])}

      graph.add_node(
          "research",
          wrap_langgraph_node(engine, run_id, "research", 0, research_node),
      )
  """

  def wrapped(state: dict[str, Any]) -> dict[str, Any]:
      record = engine.execute_step(
          run_id,
          step_name,
          step_index,
          state,
          lambda inp, key: node_fn(inp),
      )
      if record.output_data is None:
          raise RuntimeError(f"Step '{step_name}' failed without output")
      return {**state, **record.output_data}

  wrapped.__name__ = getattr(node_fn, "__name__", step_name)
  wrapped.__doc__ = node_fn.__doc__
  return wrapped


def wrap_langgraph_workflow(
    engine: ResumeEngine,
    run_id: str,
    nodes: list[tuple[str, int, Callable[[dict[str, Any]], dict[str, Any]]]],
) -> list[tuple[str, Callable[[dict[str, Any]], dict[str, Any]]]]:
  """Wrap multiple LangGraph nodes in one call.

  Args:
      engine: ResumeEngine instance.
      run_id: Active run identifier.
      nodes: List of (node_name, step_index, node_fn) tuples.

  Returns:
      List of (node_name, wrapped_fn) suitable for graph.add_node.
  """
  return [
      (name, wrap_langgraph_node(engine, run_id, name, idx, fn))
      for name, idx, fn in nodes
  ]
