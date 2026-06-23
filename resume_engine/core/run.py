"""Run data model representing an overall workflow execution."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any

from resume_engine.core.step_record import StepRecord, StepStatus


class RunStatus(str, Enum):
    """Lifecycle status of a workflow run."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"


@dataclass
class Run:
  """A single workflow execution with ordered step records.

  Attributes:
      run_id: Unique identifier for this run.
      workflow_name: Name of the wrapped workflow.
      status: Current run lifecycle status.
      created_at: UTC creation timestamp.
      updated_at: UTC last mutation timestamp.
      metadata: Arbitrary user metadata attached to the run.
      steps: Ordered list of step records (append-only audit trail).
  """

  run_id: str
  workflow_name: str
  status: RunStatus = RunStatus.PENDING
  created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
  updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
  metadata: dict[str, Any] = field(default_factory=dict)
  steps: list[StepRecord] = field(default_factory=list)

  def last_completed_step_index(self) -> int | None:
      """Return the index of the last successfully completed step, or None."""
      completed = [
          s.step_index
          for s in self.steps
          if s.status in (StepStatus.COMPLETED, StepStatus.SKIPPED_REPLAY)
      ]
      return max(completed) if completed else None

  def resume_from_index(self) -> int:
      """Return the step index to resume from (0 if no steps completed)."""
      last = self.last_completed_step_index()
      if last is None:
          return 0
      return last + 1

  def last_failed_step(self) -> StepRecord | None:
      """Return the most recent failed step record, if any."""
      failed = [s for s in self.steps if s.status == StepStatus.FAILED]
      if not failed:
          return None
      return max(failed, key=lambda s: s.sequence)

  def to_dict(self) -> dict[str, Any]:
      """Serialize the run to a JSON-compatible dictionary."""
      return {
          "run_id": self.run_id,
          "workflow_name": self.workflow_name,
          "status": self.status.value,
          "created_at": self.created_at.isoformat(),
          "updated_at": self.updated_at.isoformat(),
          "metadata": self.metadata,
          "steps": [s.to_dict() for s in self.steps],
      }

  @classmethod
  def from_dict(cls, data: dict[str, Any]) -> Run:
      """Deserialize a run from a dictionary."""
      return cls(
          run_id=data["run_id"],
          workflow_name=data["workflow_name"],
          status=RunStatus(data["status"]),
          created_at=datetime.fromisoformat(data["created_at"]),
          updated_at=datetime.fromisoformat(data["updated_at"]),
          metadata=data.get("metadata", {}),
          steps=[StepRecord.from_dict(s) for s in data.get("steps", [])],
      )

  def audit_trace(self) -> str:
      """Produce a deterministic byte-for-byte reproducible audit trace."""
      lines = [self.run_id, self.workflow_name]
      for step in sorted(self.steps, key=lambda s: s.sequence):
          lines.append(step.audit_line())
      return "\n".join(lines)
