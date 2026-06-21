#!/usr/bin/env bash
# Smoke-test Hermes API + optional DM Closer readiness for an org.
# Usage on VPS:
#   ./scripts/test-agent.sh
#   ./scripts/test-agent.sh <org_id>

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${CONVERZA_ENV:-/etc/converza/.env}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

HERMES_URL="${HERMES_URL:-http://127.0.0.1:8642}"
HERMES_URL="${HERMES_URL%/}"
KEY="${HERMES_API_KEY:-}"

echo "==> Hermes health"
curl -fsS "${HERMES_URL}/health"
echo ""

if [[ -z "$KEY" ]]; then
  echo "ERROR: HERMES_API_KEY not set" >&2
  exit 1
fi

echo "==> Hermes chat completion (minimal)"
RESP=$(curl -fsS -X POST "${HERMES_URL}/v1/chat/completions" \
  -H "Authorization: Bearer ${KEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"hermes-agent","messages":[{"role":"user","content":"Reply with exactly: AGENT_OK"}],"stream":false,"max_tokens":32,"temperature":0}')

echo "$RESP" | python3 -c "
import json, sys
data = json.load(sys.stdin)
text = data['choices'][0]['message']['content']
print('  reply:', text[:200])
if 'AGENT_OK' not in text.upper():
    raise SystemExit('  FAIL: unexpected reply')
print('  OK  Hermes LLM responding')
"

ORG_ID="${1:-}"
if [[ -n "$ORG_ID" ]]; then
  echo ""
  echo "==> Closer readiness for org $ORG_ID"
  docker compose -f "$ROOT/docker-compose.prod.yml" exec -T bot python3 - <<PY
import asyncio
from services.closer_readiness import assess_closer_readiness, readiness_label

org_id = "${ORG_ID}"
ready, reason = assess_closer_readiness(org_id)
label = readiness_label(reason)
print(f"  ready={ready} reason={reason} ({label})")
if not ready:
    raise SystemExit(1)
PY
  echo "  OK  org ready for DM Closer"
fi

echo ""
echo "==> End-to-end closer test (Telegram Business)"
echo "  1. Owner: passport + subscription + Business bot connected"
echo "  2. Customer: message the owner's Business chat (via @ConverzaSales_bot)"
echo "  3. VPS: docker compose -f docker-compose.prod.yml logs -f bot | grep -E 'generate_reply|DM Closer'"
