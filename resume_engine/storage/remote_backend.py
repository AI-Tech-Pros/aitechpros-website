"""HTTP-backed checkpoint store targeting the OrchestrateOS Cloudflare Worker API."""

from __future__ import annotations

from typing import Any

import httpx

from resume_engine.core.checkpoint_store import CheckpointStore
from resume_engine.core.run import Run
from resume_engine.core.step_record import StepRecord


class RemoteCheckpointStore(CheckpointStore):
  """Persist runs and steps via the OrchestrateOS control plane Worker + D1."""

  def __init__(self, api_url: str, *, api_key: str | None = None, timeout: float = 30.0) -> None:
      self._base = api_url.rstrip("/")
      headers: dict[str, str] = {}
      if api_key:
          headers["Authorization"] = f"Bearer {api_key}"
      self._client = httpx.Client(base_url=self._base, timeout=timeout, headers=headers)

  def close(self) -> None:
      """Release the HTTP client."""
      self._client.close()

  def __enter__(self) -> RemoteCheckpointStore:
      return self

  def __exit__(self, *args: object) -> None:
      self.close()

  def create_run(self, run: Run) -> None:
      environment = run.metadata.get("environment", "dev")
      payload: dict[str, Any] = {
          "workflow_name": run.workflow_name,
          "run_id": run.run_id,
          "metadata": run.metadata,
          "environment": environment,
      }
      resp = self._client.post("/start_run", json=payload)
      if resp.status_code == 409:
          raise ValueError(f"Run already exists: {run.run_id}")
      self._raise_for_status(resp)

  def get_run(self, run_id: str) -> Run | None:
      resp = self._client.get(f"/runs/{run_id}")
      if resp.status_code == 404:
          return None
      self._raise_for_status(resp)
      return Run.from_dict(resp.json())

  def update_run(self, run: Run) -> None:
      payload = {
          "status": run.status.value,
          "metadata": run.metadata,
      }
      resp = self._client.patch(f"/runs/{run.run_id}", json=payload)
      self._raise_for_status(resp)

  def append_step(self, run_id: str, step: StepRecord) -> None:
      payload: dict[str, Any] = {
          "step_name": step.step_name,
          "step_index": step.step_index,
          "status": step.status.value,
          "input_json": step.input_data,
          "output_json": step.output_data,
          "failure_classification": (
              step.failure_classification.value if step.failure_classification else None
          ),
          "error_message": step.error_message,
          "sequence": step.sequence,
          "idempotency_key": step.idempotency_key,
      }
      resp = self._client.post(f"/runs/{run_id}/steps", json=payload)
      self._raise_for_status(resp)

  def get_step_by_idempotency_key(self, key: str) -> StepRecord | None:
      resp = self._client.get(f"/idempotency/{key}")
      if resp.status_code == 404:
          return None
      self._raise_for_status(resp)
      return StepRecord.from_dict(resp.json())

  def idempotency_key_exists(self, key: str) -> bool:
      return self.get_step_by_idempotency_key(key) is not None

  @staticmethod
  def _raise_for_status(resp: httpx.Response) -> None:
      if resp.status_code < 400:
          return
      detail = resp.text
      try:
          body = resp.json()
          if isinstance(body, dict) and "detail" in body:
              detail = str(body["detail"])
      except Exception:
          pass
      raise httpx.HTTPStatusError(
          f"OrchestrateOS API error {resp.status_code}: {detail}",
          request=resp.request,
          response=resp,
      )
