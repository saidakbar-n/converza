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
MODEL="${HERMES_GEMINI_MODEL:-${GEMINI_MODEL:-gemini-2.0-flash}}"
BODY=$(python3 -c "import json; print(json.dumps({'model':'${MODEL}','messages':[{'role':'user','content':'Reply with exactly: AGENT_OK'}],'stream':False,'max_tokens':32,'temperature':0}))")

HTTP=$(curl -s -w "%{http_code}" -o /tmp/hermes-test.json \
  -X POST "${HERMES_URL}/v1/chat/completions" \
  -H "Authorization: Bearer ${KEY}" \
  -H "Content-Type: application/json" \
  -d "$BODY")
echo "  model: ${MODEL}  HTTP: ${HTTP}"

python3 <<'PY'
import json, sys
raw = open("/tmp/hermes-test.json").read()
try:
    data = json.loads(raw)
except json.JSONDecodeError:
    print("  raw:", raw[:500])
    sys.exit(1)
if "error" in data:
    print("  ERROR:", data["error"])
    sys.exit(1)
try:
    text = data["choices"][0]["message"]["content"]
except (KeyError, IndexError, TypeError):
    print("  unexpected:", data)
    sys.exit(1)
print("  reply:", text[:200])
if "AGENT_OK" not in text.upper() and "GEMINI_OK" not in text.upper():
    if "404" in text or "failed" in text.lower():
        print("  FAIL: LLM provider error — run ./scripts/diag-gemini.sh")
        sys.exit(1)
    print("  WARN: unexpected wording but Hermes returned text")
print("  OK  Hermes LLM responding")
PY

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
