"""CrewAI Flow task wrapper for checkpoint-after-every-task execution."""

from __future__ import annotations

from typing import Any, Callable

from resume_engine.core.checkpoint_store import ResumeEngine


def wrap_crewai_task(
    engine: ResumeEngine,
    run_id: str,
    task_name: str,
    step_index: int,
    task_fn: Callable[[dict[str, Any]], dict[str, Any]],
) -> Callable[[dict[str, Any]], dict[str, Any]]:
  """Wrap a CrewAI Flow task with durable checkpointing.

  Use as a drop-in wrapper around any task's execute logic. The Flow
  definition itself requires no structural changes.

  Example:
      @start()
      def ingest(self):
          return wrap_crewai_task(
              engine, run_id, "ingest", 0, self._ingest_impl
          )(self.state)
  """

  def wrapped(state: dict[str, Any] | None = None, **kwargs: Any) -> dict[str, Any]:
      merged = {**(state or {}), **kwargs}
      record = engine.execute_step(
          run_id,
          task_name,
          step_index,
          merged,
          lambda inp, key: task_fn(inp),
      )
      if record.output_data is None:
          raise RuntimeError(f"Task '{task_name}' failed without output")
      return record.output_data

  wrapped.__name__ = getattr(task_fn, "__name__", task_name)
  wrapped.__doc__ = task_fn.__doc__
  return wrapped


def wrap_crewai_flow_tasks(
    engine: ResumeEngine,
    run_id: str,
    tasks: list[tuple[str, int, Callable[[dict[str, Any]], dict[str, Any]]]],
) -> list[tuple[str, Callable[[dict[str, Any]], dict[str, Any]]]]:
  """Wrap multiple CrewAI Flow tasks in one call.

  Args:
      engine: ResumeEngine instance.
      run_id: Active run identifier.
      tasks: List of (task_name, step_index, task_fn) tuples.

  Returns:
      List of (task_name, wrapped_fn) pairs.
  """
  return [
      (name, wrap_crewai_task(engine, run_id, name, idx, fn))
      for name, idx, fn in tasks
  ]
