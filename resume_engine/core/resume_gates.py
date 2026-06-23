"""Resume gates for partial and permanent failure handling."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from resume_engine.core.run import Run, RunStatus
from resume_engine.core.step_record import FailureClassification, StepRecord, StepStatus


class ResumeBlockedError(Exception):
  """Raised when resume is blocked by uncompensated or unapproved failures."""

  def __init__(self, blockers: list[ResumeBlocker]) -> None:
      self.blockers = blockers
      messages = "; ".join(b.message for b in blockers)
      super().__init__(f"Resume blocked: {messages}")


@dataclass(frozen=True)
class ResumeBlocker:
  """Describes an action required before a run may resume."""

  classification: FailureClassification
  step_index: int
  step_name: str
  failure_key: str
  message: str
  required_action: str

  def to_dict(self) -> dict[str, Any]:
      """Serialize for API responses."""
      return {
          "classification": self.classification.value,
          "step_index": self.step_index,
          "step_name": self.step_name,
          "failure_key": self.failure_key,
          "message": self.message,
          "required_action": self.required_action,
      }


def failure_key(step: StepRecord) -> str:
  """Unique key for a specific failure event (supports re-failure after resume)."""
  return f"{step.step_index}:{step.sequence}"


def get_gates_metadata(run: Run) -> dict[str, Any]:
  """Return the gates sub-object from run metadata."""
  return dict(run.metadata.get("gates", {}))


def get_resume_blockers(run: Run) -> list[ResumeBlocker]:
  """Return actions that must be completed before ``resume()`` may proceed."""
  if run.status not in (RunStatus.FAILED, RunStatus.PAUSED):
      return []

  failed = run.last_failed_step()
  if failed is None or failed.failure_classification is None:
      return []

  classification = failed.failure_classification
  key = failure_key(failed)
  gates = get_gates_metadata(run)

  if classification == FailureClassification.TRANSIENT:
      return []

  if classification == FailureClassification.PARTIAL:
      compensations = gates.get("compensations", {})
      if key in compensations:
          return []
      return [
          ResumeBlocker(
              classification=classification,
              step_index=failed.step_index,
              step_name=failed.step_name,
              failure_key=key,
              message=failed.error_message or "Partial failure requires compensation",
              required_action="compensation",
          )
      ]

  if classification == FailureClassification.PERMANENT:
      approval = gates.get("human_approval", {})
      if approval.get("failure_key") == key and approval.get("granted"):
          return []
      return [
          ResumeBlocker(
              classification=classification,
              step_index=failed.step_index,
              step_name=failed.step_name,
              failure_key=key,
              message=failed.error_message or "Permanent failure requires human approval",
              required_action="human_approval",
          )
      ]

  return []


def assert_can_resume(run: Run) -> None:
  """Raise ``ResumeBlockedError`` if resume preconditions are not met."""
  blockers = get_resume_blockers(run)
  if blockers:
      raise ResumeBlockedError(blockers)
