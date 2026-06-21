#!/usr/bin/env bash
# Wait for Hermes API on :8642 (first start on 2GB VPS can take 2–3 min).
set -euo pipefail

HERMES_URL="${HERMES_URL:-http://127.0.0.1:8642}"
HERMES_URL="${HERMES_URL%/}"
MAX_WAIT="${HERMES_WAIT_SEC:-180}"
INTERVAL="${HERMES_WAIT_INTERVAL:-5}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

elapsed=0
while [[ "$elapsed" -lt "$MAX_WAIT" ]]; do
  if curl -fsS -m 3 "${HERMES_URL}/health" >/dev/null 2>&1; then
    echo "  OK  Hermes healthy (${elapsed}s)"
    exit 0
  fi
  if [[ "$elapsed" -eq 0 ]]; then
    echo "  waiting for ${HERMES_URL}/health (up to ${MAX_WAIT}s)..."
  fi
  sleep "$INTERVAL"
  elapsed=$((elapsed + INTERVAL))
done

echo "  FAIL  Hermes not responding after ${MAX_WAIT}s" >&2
echo "  Check: docker compose -f ${ROOT}/${COMPOSE_FILE} ps hermes" >&2
echo "  Logs:  docker compose -f ${ROOT}/${COMPOSE_FILE} logs hermes --tail 60" >&2
if command -v dmesg >/dev/null 2>&1; then
  if dmesg 2>/dev/null | tail -5 | grep -qi 'killed process'; then
    echo "  Hint: possible OOM — consider swap or a 4GB droplet" >&2
  fi
fi
exit 1
