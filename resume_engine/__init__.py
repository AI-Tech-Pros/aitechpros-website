"""OrchestrateOS resume_engine — deterministic execution for agent workflows."""

from resume_engine.core.checkpoint_store import CheckpointStore, ResumeEngine
from resume_engine.core.failure_classifier import (
    FailureClassification,
    PartialStepError,
    PermanentStepError,
    TransientStepError,
    classify_failure,
)
from resume_engine.core.idempotency import (
    IdempotencyCollisionError,
    generate_idempotency_key,
    generate_run_id,
    hash_input,
)
from resume_engine.core.resume_gates import ResumeBlockedError, ResumeBlocker
from resume_engine.core.run import Run, RunStatus
from resume_engine.core.step_record import StepRecord, StepStatus
from resume_engine.storage.sqlite_backend import SQLiteCheckpointStore

__version__ = "0.2.0"

__all__ = [
    "CheckpointStore",
    "ResumeEngine",
    "SQLiteCheckpointStore",
    "Run",
    "RunStatus",
    "StepRecord",
    "StepStatus",
    "FailureClassification",
    "TransientStepError",
    "PermanentStepError",
    "PartialStepError",
    "ResumeBlockedError",
    "ResumeBlocker",
    "IdempotencyCollisionError",
    "classify_failure",
    "generate_run_id",
    "generate_idempotency_key",
    "hash_input",
    "__version__",
]
