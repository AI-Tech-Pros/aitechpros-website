"""Failure classification for workflow step errors."""

from __future__ import annotations

from typing import Any

from resume_engine.core.step_record import FailureClassification


# Exception types mapped to failure classifications.
_TRANSIENT_EXCEPTIONS: tuple[type[BaseException], ...] = (
    ConnectionError,
    TimeoutError,
    OSError,
)

_PERMANENT_EXCEPTIONS: tuple[type[BaseException], ...] = (
    ValueError,
    TypeError,
    KeyError,
    PermissionError,
)


class TransientStepError(Exception):
  """A transient failure safe to retry automatically."""


class PermanentStepError(Exception):
  """A permanent failure requiring human intervention."""


class PartialStepError(Exception):
  """A partial failure where some side effects already executed."""


def classify_failure(
    exc: BaseException | None = None,
    *,
    classification: FailureClassification | None = None,
    message: str | None = None,
) -> tuple[FailureClassification, str]:
  """Classify a step failure for resume policy decisions.

  Args:
      exc: The exception that caused the failure.
      classification: Explicit override classification.
      message: Optional override error message.

  Returns:
      Tuple of (classification, error_message).
  """
  if classification is not None:
      return classification, message or str(exc or classification.value)

  if exc is None:
      return FailureClassification.TRANSIENT, message or "Unknown error"

  if isinstance(exc, TransientStepError):
      return FailureClassification.TRANSIENT, str(exc)
  if isinstance(exc, PermanentStepError):
      return FailureClassification.PERMANENT, str(exc)
  if isinstance(exc, PartialStepError):
      return FailureClassification.PARTIAL, str(exc)

  for exc_type in _TRANSIENT_EXCEPTIONS:
      if isinstance(exc, exc_type):
          return FailureClassification.TRANSIENT, str(exc)

  for exc_type in _PERMANENT_EXCEPTIONS:
      if isinstance(exc, exc_type):
          return FailureClassification.PERMANENT, str(exc)

  # Default: treat unknown errors as transient (retry once, then escalate).
  return FailureClassification.TRANSIENT, str(exc)


def can_auto_resume(classification: FailureClassification) -> bool:
  """Return True if the engine may automatically resume after this failure."""
  return classification == FailureClassification.TRANSIENT


def requires_compensation(classification: FailureClassification) -> bool:
  """Return True if a compensation step must run before retry."""
  return classification == FailureClassification.PARTIAL


def requires_human_intervention(classification: FailureClassification) -> bool:
  """Return True if human intervention is required before resume."""
  return classification == FailureClassification.PERMANENT
