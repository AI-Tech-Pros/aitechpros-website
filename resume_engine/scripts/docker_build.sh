#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

IMAGE="${IMAGE:-orchestrateos-api:latest}"
PLATFORM="${PLATFORM:-linux/amd64}"

echo "Building ${IMAGE}..."
docker build \
  --platform "${PLATFORM}" \
  -f resume_engine/Dockerfile \
  -t "${IMAGE}" \
  .

echo "Done. Run locally with:"
echo "  docker run --rm -p 8000:8000 -v orchestrateos_data:/data ${IMAGE}"
