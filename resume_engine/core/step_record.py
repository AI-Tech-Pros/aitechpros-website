"""Step record data model for durable workflow checkpoints."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any


class StepStatus(str, Enum):
    """Lifecycle status of a single workflow step."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED_REPLAY = "skipped_replay"


class FailureClassification(str, Enum):
    """How a step failure should be handled on resume."""

    TRANSIENT = "transient"
    PERMANENT = "permanent"
    PARTIAL = "partial"


@dataclass
class StepRecord:
  """Immutable record of one step execution within a run.

  Attributes:
      step_name: Human-readable step identifier.
      step_index: Zero-based position in the run's ordered step list.
      input_data: Serialized input passed to the step.
      input_hash: SHA-256 hash of canonical input JSON for replay verification.
      output_data: Serialized output produced by the step (None if failed).
      status: Current lifecycle status.
      idempotency_key: Unique key preventing duplicate side effects on resume.
      timestamp: UTC time when the record was last updated.
      failure_classification: Set when status is FAILED.
      error_message: Optional error detail when status is FAILED.
      sequence: Monotonic ordering key within the run (for audit log ordering).
  """

  step_name: str
  step_index: int
  input_data: dict[str, Any]
  input_hash: str
  output_data: dict[str, Any] | None
  status: StepStatus
  idempotency_key: str
  timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
  failure_classification: FailureClassification | None = None
  error_message: str | None = None
  sequence: int = 0

  def to_dict(self) -> dict[str, Any]:
      """Serialize the record to a JSON-compatible dictionary."""
      return {
          "step_name": self.step_name,
          "step_index": self.step_index,
          "input_data": self.input_data,
          "input_hash": self.input_hash,
          "output_data": self.output_data,
          "status": self.status.value,
          "idempotency_key": self.idempotency_key,
          "timestamp": self.timestamp.isoformat(),
          "failure_classification": (
              self.failure_classification.value if self.failure_classification else None
          ),
          "error_message": self.error_message,
          "sequence": self.sequence,
      }

  @classmethod
  def from_dict(cls, data: dict[str, Any]) -> StepRecord:
      """Deserialize a record from a dictionary."""
      failure = data.get("failure_classification")
      return cls(
          step_name=data["step_name"],
          step_index=data["step_index"],
          input_data=data["input_data"],
          input_hash=data["input_hash"],
          output_data=data.get("output_data"),
          status=StepStatus(data["status"]),
          idempotency_key=data["idempotency_key"],
          timestamp=datetime.fromisoformat(data["timestamp"]),
          failure_classification=FailureClassification(failure) if failure else None,
          error_message=data.get("error_message"),
          sequence=data.get("sequence", 0),
      )

  def audit_line(self) -> str:
      """Produce a deterministic single-line audit trace entry."""
      payload = {
          "step_name": self.step_name,
          "step_index": self.step_index,
          "input_hash": self.input_hash,
          "output_data": self.output_data,
          "status": self.status.value,
          "idempotency_key": self.idempotency_key,
          "sequence": self.sequence,
      }
      return json.dumps(payload, sort_keys=True, separators=(",", ":"))
