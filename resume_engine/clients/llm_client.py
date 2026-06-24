"""HTTP client for OrchestrateOS LLM completion API."""

from __future__ import annotations

from typing import Any, Literal

import httpx

LlmProvider = Literal["workers-ai", "openai", "anthropic", "auto"]
LlmRole = Literal["system", "user", "assistant"]


class OrchestrateOSLlmClient:
  """Call POST /llm/complete on the OrchestrateOS Worker control plane."""

  def __init__(self, api_url: str, *, api_key: str | None = None, timeout: float = 60.0) -> None:
      self._base = api_url.rstrip("/")
      headers: dict[str, str] = {"Content-Type": "application/json"}
      if api_key:
          headers["Authorization"] = f"Bearer {api_key}"
      self._client = httpx.Client(base_url=self._base, timeout=timeout, headers=headers)

  def close(self) -> None:
      self._client.close()

  def __enter__(self) -> OrchestrateOSLlmClient:
      return self

  def __exit__(self, *args: object) -> None:
      self.close()

  def status(self) -> dict[str, Any]:
      resp = self._client.get("/llm/status")
      resp.raise_for_status()
      return resp.json()

  def complete(
      self,
      messages: list[dict[str, str]],
      *,
      model: str | None = None,
      max_tokens: int | None = None,
      temperature: float | None = None,
      provider: LlmProvider = "auto",
  ) -> dict[str, Any]:
      payload: dict[str, Any] = {"messages": messages, "provider": provider}
      if model is not None:
          payload["model"] = model
      if max_tokens is not None:
          payload["max_tokens"] = max_tokens
      if temperature is not None:
          payload["temperature"] = temperature
      resp = self._client.post("/llm/complete", json=payload)
      resp.raise_for_status()
      return resp.json()
