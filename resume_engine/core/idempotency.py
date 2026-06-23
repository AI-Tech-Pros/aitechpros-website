"""Idempotency key generation and collision handling."""

from __future__ import annotations

import hashlib
import json
import uuid
from typing import Any


def canonical_json(data: Any) -> str:
  """Serialize data to a canonical JSON string for hashing."""
  return json.dumps(data, sort_keys=True, separators=(",", ":"), default=str)


def hash_input(data: dict[str, Any]) -> str:
  """Compute SHA-256 hash of step input for replay verification."""
  return hashlib.sha256(canonical_json(data).encode("utf-8")).hexdigest()


def generate_idempotency_key(
    run_id: str,
    step_name: str,
    step_index: int,
    input_hash: str,
) -> str:
  """Generate a deterministic idempotency key for a step invocation.

  The key is derived from run context so that retries of the same logical
  step produce the same key, while distinct steps never collide.
  """
  material = f"{run_id}:{step_name}:{step_index}:{input_hash}"
  return hashlib.sha256(material.encode("utf-8")).hexdigest()


def generate_run_id() -> str:
  """Generate a new unique run identifier."""
  return str(uuid.uuid4())


class IdempotencyRegistry:
  """In-memory registry tracking idempotency keys for collision detection.

  The checkpoint store persists keys durably; this registry provides fast
  local checks during a single process execution.
  """

  def __init__(self) -> None:
      self._keys: dict[str, str] = {}

  def register(self, key: str, step_name: str) -> None:
      """Register an idempotency key, raising on collision with different step."""
      existing = self._keys.get(key)
      if existing is not None and existing != step_name:
          raise IdempotencyCollisionError(
              f"Idempotency key {key} already used by step '{existing}', "
              f"cannot reuse for step '{step_name}'"
          )
      self._keys[key] = step_name

  def is_registered(self, key: str) -> bool:
      """Return True if the key has been registered in this process."""
      return key in self._keys

  def clear(self) -> None:
      """Clear all registered keys (primarily for testing)."""
      self._keys.clear()


class IdempotencyCollisionError(Exception):
  """Raised when an idempotency key collision is detected."""
