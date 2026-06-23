"""Abstract checkpoint store and resume engine orchestration."""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Callable

from resume_engine.core.failure_classifier import classify_failure
from resume_engine.core.idempotency import (
    IdempotencyCollisionError,
    IdempotencyRegistry,
    generate_idempotency_key,
    generate_run_id,
    hash_input,
)
from resume_engine.core.run import Run, RunStatus
from resume_engine.core.resume_gates import (
    ResumeBlockedError,
    assert_can_resume,
    failure_key,
    get_resume_blockers,
)
from resume_engine.core.step_record import (
    FailureClassification,
    StepRecord,
    StepStatus,
)

StepCallable = Callable[[dict[str, Any], str], dict[str, Any]]


class CheckpointStore(ABC):
  """Durable storage interface for runs and step checkpoints."""

  @abstractmethod
  def create_run(self, run: Run) -> None:
      """Persist a new run."""

  @abstractmethod
  def get_run(self, run_id: str) -> Run | None:
      """Load a run by ID, or None if not found."""

  @abstractmethod
  def update_run(self, run: Run) -> None:
      """Persist run metadata updates."""

  @abstractmethod
  def append_step(self, run_id: str, step: StepRecord) -> None:
      """Append a step record to a run's audit log."""

  @abstractmethod
  def get_step_by_idempotency_key(self, key: str) -> StepRecord | None:
      """Look up a completed step by idempotency key."""

  @abstractmethod
  def idempotency_key_exists(self, key: str) -> bool:
      """Return True if an idempotency key is already persisted."""


class ResumeEngine:
  """Framework-agnostic deterministic execution layer.

  Provides state persistence, idempotent step execution, resume capability,
  deterministic replay, and failure classification.
  """

  def __init__(self, store: CheckpointStore) -> None:
      self._store = store
      self._idempotency = IdempotencyRegistry()

  @property
  def store(self) -> CheckpointStore:
      """The underlying checkpoint store."""
      return self._store

  def start_run(
      self,
      workflow_name: str,
      *,
      run_id: str | None = None,
      metadata: dict[str, Any] | None = None,
  ) -> Run:
      """Create and persist a new workflow run."""
      run = Run(
          run_id=run_id or generate_run_id(),
          workflow_name=workflow_name,
          status=RunStatus.RUNNING,
          metadata=metadata or {},
      )
      self._store.create_run(run)
      return run

  def execute_step(
      self,
      run_id: str,
      step_name: str,
      step_index: int,
      input_data: dict[str, Any],
      step_fn: StepCallable,
      *,
      replay_mode: bool = False,
  ) -> StepRecord:
      """Execute a single durable step with checkpointing and idempotency.

      If a completed step with the same idempotency key exists, returns the
      cached record without re-executing (idempotent skip).

      Args:
          run_id: The parent run identifier.
          step_name: Human-readable step name.
          step_index: Position in the workflow.
          input_data: Step input payload.
          step_fn: Callable(input_data, idempotency_key) -> output_data.
          replay_mode: If True, replay outputs from log without executing.
      """
      input_hash = hash_input(input_data)
      idem_key = generate_idempotency_key(run_id, step_name, step_index, input_hash)

      existing = self._store.get_step_by_idempotency_key(idem_key)
      if existing and existing.status in (
          StepStatus.COMPLETED,
          StepStatus.SKIPPED_REPLAY,
      ):
          return existing

      try:
          self._idempotency.register(idem_key, step_name)
      except IdempotencyCollisionError:
          raise

      if self._store.idempotency_key_exists(idem_key):
          cached = self._store.get_step_by_idempotency_key(idem_key)
          if cached and cached.status in (
              StepStatus.COMPLETED,
              StepStatus.SKIPPED_REPLAY,
          ):
              return cached

      run = self._store.get_run(run_id)
      if run is None:
          raise ValueError(f"Run not found: {run_id}")

      sequence = len(run.steps)

      if replay_mode:
          replay_source = self._find_replay_source(run, step_index, input_hash)
          if replay_source and replay_source.output_data is not None:
              record = StepRecord(
                  step_name=step_name,
                  step_index=step_index,
                  input_data=input_data,
                  input_hash=input_hash,
                  output_data=replay_source.output_data,
                  status=StepStatus.COMPLETED,
                  idempotency_key=idem_key,
                  sequence=sequence,
              )
              self._store.append_step(run_id, record)
              return record

      running_record = StepRecord(
          step_name=step_name,
          step_index=step_index,
          input_data=input_data,
          input_hash=input_hash,
          output_data=None,
          status=StepStatus.RUNNING,
          idempotency_key=idem_key,
          sequence=sequence,
      )

      try:
          output_data = step_fn(input_data, idem_key)
          completed = StepRecord(
              step_name=step_name,
              step_index=step_index,
              input_data=input_data,
              input_hash=input_hash,
              output_data=output_data,
              status=StepStatus.COMPLETED,
              idempotency_key=idem_key,
              sequence=sequence,
          )
          self._store.append_step(run_id, completed)
          return completed
      except Exception as exc:
          classification, message = classify_failure(exc)
          failed = StepRecord(
              step_name=step_name,
              step_index=step_index,
              input_data=input_data,
              input_hash=input_hash,
              output_data=None,
              status=StepStatus.FAILED,
              idempotency_key=idem_key,
              failure_classification=classification,
              error_message=message,
              sequence=sequence,
          )
          self._store.append_step(run_id, failed)
          run.status = RunStatus.FAILED
          run.updated_at = datetime.now(timezone.utc)
          self._store.update_run(run)
          raise

  def execute_workflow(
      self,
      run_id: str,
      steps: list[tuple[str, StepCallable]],
      *,
      initial_input: dict[str, Any] | None = None,
      start_index: int = 0,
      replay_mode: bool = False,
      inject_failure_at: int | None = None,
  ) -> Run:
      """Execute an ordered list of steps, checkpointing after each.

      Args:
          run_id: The run to execute.
          steps: List of (step_name, callable) pairs.
          initial_input: Seed input for step 0.
          start_index: Step index to begin execution (for resume).
          replay_mode: Replay from audit log without recomputation.
          inject_failure_at: Test hook — raise at this step index.
      """
      run = self._store.get_run(run_id)
      if run is None:
          raise ValueError(f"Run not found: {run_id}")

      run.status = RunStatus.RUNNING
      run.updated_at = datetime.now(timezone.utc)
      self._store.update_run(run)

      current_input = dict(initial_input or {})
      last_output: dict[str, Any] = {}

      for idx in range(start_index, len(steps)):
          step_name, step_fn = steps[idx]
          step_input = dict(current_input)

          if inject_failure_at is not None and idx == inject_failure_at:
              from resume_engine.core.failure_classifier import TransientStepError

              try:
                  self.execute_step(
                      run_id,
                      step_name,
                      idx,
                      step_input,
                      lambda inp, key: (_ for _ in ()).throw(
                          TransientStepError(f"Injected failure at step {idx + 1}")
                      ),
                      replay_mode=replay_mode,
                  )
              except TransientStepError:
                  raise

          record = self.execute_step(
              run_id,
              step_name,
              idx,
              step_input,
              lambda inp, key, fn=step_fn, base=step_input: fn({**base, **inp}, key),
              replay_mode=replay_mode,
          )
          if record.output_data is not None:
              current_input = {**current_input, **record.output_data}

      run = self._store.get_run(run_id)
      if run is None:
          raise ValueError(f"Run not found: {run_id}")

      if run.status != RunStatus.FAILED:
          run.status = RunStatus.COMPLETED
          run.updated_at = datetime.now(timezone.utc)
          self._store.update_run(run)

      return run

  def resume(
      self,
      run_id: str,
      steps: list[tuple[str, StepCallable]],
      *,
      initial_input: dict[str, Any] | None = None,
      replay_mode: bool = False,
      skip_gate_check: bool = False,
  ) -> Run:
      """Resume a failed or paused run from the last completed step.

      Skips all steps before the failure point by replaying their cached
      outputs from the checkpoint store.

      Raises:
          ResumeBlockedError: If a partial failure lacks compensation or a
              permanent failure lacks human approval.
      """
      run = self._store.get_run(run_id)
      if run is None:
          raise ValueError(f"Run not found: {run_id}")

      if not skip_gate_check:
          assert_can_resume(run)

      start_index = run.resume_from_index()

      return self.execute_workflow(
          run_id,
          steps,
          initial_input=initial_input,
          start_index=start_index,
          replay_mode=replay_mode,
      )

  def get_resume_blockers(self, run_id: str) -> list:
      """Return gate blockers preventing resume for the given run."""
      run = self._store.get_run(run_id)
      if run is None:
          raise ValueError(f"Run not found: {run_id}")
      return get_resume_blockers(run)

  def execute_compensation(
      self,
      run_id: str,
      compensation_fn: StepCallable,
      *,
      input_data: dict[str, Any] | None = None,
  ) -> StepRecord:
      """Run a compensation step for the latest partial failure.

      Compensation must complete before the failed step may be retried on resume.
      """
      run = self._store.get_run(run_id)
      if run is None:
          raise ValueError(f"Run not found: {run_id}")

      failed = run.last_failed_step()
      if failed is None or failed.failure_classification != FailureClassification.PARTIAL:
          raise ValueError("No partial failure requiring compensation")

      key = failure_key(failed)
      gates = dict(run.metadata.get("gates", {}))
      compensations = dict(gates.get("compensations", {}))
      if key in compensations:
          raise ValueError(f"Failure {key} already compensated")

      compensate_input = input_data if input_data is not None else dict(failed.input_data)
      record = self.execute_step(
          run_id,
          f"__compensate__{failed.step_name}",
          failed.step_index,
          compensate_input,
          compensation_fn,
      )

      compensations[key] = {
          "completed_at": datetime.now(timezone.utc).isoformat(),
          "step_sequence": record.sequence,
          "output": record.output_data,
      }
      gates["compensations"] = compensations
      run.metadata["gates"] = gates
      run.status = RunStatus.PAUSED
      run.updated_at = datetime.now(timezone.utc)
      self._store.update_run(run)
      return record

  def record_compensation(
      self,
      run_id: str,
      *,
      result: dict[str, Any] | None = None,
      note: str | None = None,
  ) -> Run:
      """Record that compensation was performed externally (API / manual ops)."""
      run = self._store.get_run(run_id)
      if run is None:
          raise ValueError(f"Run not found: {run_id}")

      failed = run.last_failed_step()
      if failed is None or failed.failure_classification != FailureClassification.PARTIAL:
          raise ValueError("No partial failure requiring compensation")

      key = failure_key(failed)
      gates = dict(run.metadata.get("gates", {}))
      compensations = dict(gates.get("compensations", {}))
      if key in compensations:
          raise ValueError(f"Failure {key} already compensated")

      compensations[key] = {
          "completed_at": datetime.now(timezone.utc).isoformat(),
          "result": result or {},
          "note": note,
          "recorded_externally": True,
      }
      gates["compensations"] = compensations
      run.metadata["gates"] = gates
      run.status = RunStatus.PAUSED
      run.updated_at = datetime.now(timezone.utc)
      self._store.update_run(run)
      return run

  def grant_human_approval(
      self,
      run_id: str,
      approved_by: str,
      *,
      note: str | None = None,
  ) -> Run:
      """Grant human approval to resume after a permanent failure."""
      run = self._store.get_run(run_id)
      if run is None:
          raise ValueError(f"Run not found: {run_id}")

      failed = run.last_failed_step()
      if failed is None or failed.failure_classification != FailureClassification.PERMANENT:
          raise ValueError("No permanent failure requiring human approval")

      key = failure_key(failed)
      gates = dict(run.metadata.get("gates", {}))
      gates["human_approval"] = {
          "granted": True,
          "failure_key": key,
          "approved_by": approved_by,
          "approved_at": datetime.now(timezone.utc).isoformat(),
          "note": note,
      }
      run.metadata["gates"] = gates
      run.status = RunStatus.PAUSED
      run.updated_at = datetime.now(timezone.utc)
      self._store.update_run(run)
      return run

  def get_run_status(self, run_id: str) -> Run | None:
      """Return the current run state."""
      return self._store.get_run(run_id)

  def get_audit_log(self, run_id: str) -> str:
      """Return the deterministic audit trace for a run."""
      run = self._store.get_run(run_id)
      if run is None:
          raise ValueError(f"Run not found: {run_id}")
      return run.audit_trace()

  def replay_run(
      self,
      run_id: str,
      steps: list[tuple[str, StepCallable]],
      *,
      initial_input: dict[str, Any] | None = None,
  ) -> tuple[Run, str]:
      """Replay an entire run from recorded inputs in replay mode.

      Re-executes the workflow using cached outputs from the source run's
      audit log. Returns the run and audit trace for byte-for-byte comparison.
      """
      original = self._store.get_run(run_id)
      if original is None:
          raise ValueError(f"Run not found: {run_id}")

      replay = self.start_run(
          f"{original.workflow_name}_replay",
          metadata={"replayed_from": run_id},
      )
      # Seed replay run with source checkpoints for lookup
      for step in original.steps:
          if step.status == StepStatus.COMPLETED:
              self._store.append_step(replay.run_id, step)

      self.execute_workflow(
          replay.run_id,
          steps,
          initial_input=initial_input,
          start_index=0,
          replay_mode=True,
      )
      trace = self.get_audit_log(replay.run_id)
      final = self._store.get_run(replay.run_id)
      assert final is not None
      return final, trace

  @staticmethod
  def _find_replay_source(
      run: Run,
      step_index: int,
      input_hash: str,
  ) -> StepRecord | None:
      """Find a completed step in the run matching index and input hash."""
      for step in run.steps:
          if (
              step.step_index == step_index
              and step.input_hash == input_hash
              and step.status == StepStatus.COMPLETED
              and step.output_data is not None
          ):
              return step
      return None
