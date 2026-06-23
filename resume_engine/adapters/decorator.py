"""Plain Python @durable_step decorator for framework-agnostic use."""

from __future__ import annotations

import functools
from typing import Any, Callable, TypeVar

from resume_engine.core.checkpoint_store import ResumeEngine

F = TypeVar("F", bound=Callable[..., Any])


def durable_step(
    engine: ResumeEngine,
    run_id: str,
    step_name: str,
    step_index: int,
) -> Callable[[F], F]:
  """Decorator that wraps a function as a durable, checkpointed step.

  The decorated function receives (input_data, idempotency_key) when called
  through the engine, but can be written as a normal function accepting
  a single dict argument.

  Example:
      @durable_step(engine, run_id, "fetch_data", 0)
      def fetch_data(state: dict) -> dict:
          return {"data": api.fetch(state["url"])}
  """

  def decorator(fn: F) -> F:
      @functools.wraps(fn)
      def wrapper(input_data: dict[str, Any], idempotency_key: str = "") -> dict[str, Any]:
          result = fn(input_data)
          if not isinstance(result, dict):
              raise TypeError(
                  f"durable_step '{step_name}' must return dict, got {type(result)}"
              )
          return result

      wrapper._durable_step_name = step_name  # type: ignore[attr-defined]
      wrapper._durable_step_index = step_index  # type: ignore[attr-defined]
      wrapper._resume_engine = engine  # type: ignore[attr-defined]
      wrapper._run_id = run_id  # type: ignore[attr-defined]

      def execute(input_data: dict[str, Any] | None = None, **kwargs: Any) -> dict[str, Any]:
          merged = {**(input_data or {}), **kwargs}
          record = engine.execute_step(
              run_id,
              step_name,
              step_index,
              merged,
              lambda inp, key: fn(inp),
          )
          return record.output_data or {}

      wrapper.execute = execute  # type: ignore[attr-defined]
      return wrapper  # type: ignore[return-value]

  return decorator
