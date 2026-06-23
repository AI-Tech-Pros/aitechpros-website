"""SQLite-backed checkpoint store for local development."""

from __future__ import annotations

import json
from datetime import datetime, timezone

from resume_engine.core.checkpoint_store import CheckpointStore
from resume_engine.core.run import Run, RunStatus
from resume_engine.core.step_record import FailureClassification, StepRecord, StepStatus
from resume_engine.storage.models import RunRow, StepRow, create_session_factory


class SQLiteCheckpointStore(CheckpointStore):
  """Durable checkpoint storage using SQLite via SQLAlchemy."""

  def __init__(self, database_url: str = "sqlite:///resume_engine.db") -> None:
      self._session_factory, self._engine = create_session_factory(database_url)

  def close(self) -> None:
      """Release database connections (call after tests or shutdown)."""
      self._engine.dispose()

  def create_run(self, run: Run) -> None:
      with self._session_factory() as session:
          row = RunRow(
              run_id=run.run_id,
              workflow_name=run.workflow_name,
              status=run.status.value,
              created_at=run.created_at,
              updated_at=run.updated_at,
              metadata_json=json.dumps(run.metadata),
          )
          session.add(row)
          session.commit()

  def get_run(self, run_id: str) -> Run | None:
      with self._session_factory() as session:
          row = session.get(RunRow, run_id)
          if row is None:
              return None
          steps = (
              session.query(StepRow)
              .filter(StepRow.run_id == run_id)
              .order_by(StepRow.sequence)
              .all()
          )
          return self._row_to_run(row, steps)

  def update_run(self, run: Run) -> None:
      with self._session_factory() as session:
          row = session.get(RunRow, run.run_id)
          if row is None:
              raise ValueError(f"Run not found: {run.run_id}")
          row.status = run.status.value
          row.updated_at = run.updated_at
          row.metadata_json = json.dumps(run.metadata)
          session.commit()

  def append_step(self, run_id: str, step: StepRecord) -> None:
      with self._session_factory() as session:
          row = StepRow(
              run_id=run_id,
              step_name=step.step_name,
              step_index=step.step_index,
              input_json=json.dumps(step.input_data),
              input_hash=step.input_hash,
              output_json=json.dumps(step.output_data) if step.output_data else None,
              status=step.status.value,
              idempotency_key=step.idempotency_key,
              timestamp=step.timestamp,
              failure_classification=(
                  step.failure_classification.value if step.failure_classification else None
              ),
              error_message=step.error_message,
              sequence=step.sequence,
          )
          session.add(row)
          run_row = session.get(RunRow, run_id)
          if run_row:
              run_row.updated_at = datetime.now(timezone.utc)
          session.commit()

  def get_step_by_idempotency_key(self, key: str) -> StepRecord | None:
      with self._session_factory() as session:
          row = (
              session.query(StepRow)
              .filter(StepRow.idempotency_key == key)
              .filter(StepRow.status.in_(["completed", "skipped_replay"]))
              .order_by(StepRow.sequence.desc())
              .first()
          )
          if row is None:
              return None
          return self._step_row_to_record(row)

  def idempotency_key_exists(self, key: str) -> bool:
      with self._session_factory() as session:
          return (
              session.query(StepRow)
              .filter(StepRow.idempotency_key == key)
              .filter(StepRow.status.in_(["completed", "skipped_replay"]))
              .first()
              is not None
          )

  @staticmethod
  def _step_row_to_record(row: StepRow) -> StepRecord:
      failure = row.failure_classification
      return StepRecord(
          step_name=row.step_name,
          step_index=row.step_index,
          input_data=json.loads(row.input_json),
          input_hash=row.input_hash,
          output_data=json.loads(row.output_json) if row.output_json else None,
          status=StepStatus(row.status),
          idempotency_key=row.idempotency_key,
          timestamp=row.timestamp,
          failure_classification=FailureClassification(failure) if failure else None,
          error_message=row.error_message,
          sequence=row.sequence,
      )

  @staticmethod
  def _row_to_run(row: RunRow, steps: list[StepRow]) -> Run:
      return Run(
          run_id=row.run_id,
          workflow_name=row.workflow_name,
          status=RunStatus(row.status),
          created_at=row.created_at,
          updated_at=row.updated_at,
          metadata=json.loads(row.metadata_json),
          steps=[SQLiteCheckpointStore._step_row_to_record(s) for s in steps],
      )
