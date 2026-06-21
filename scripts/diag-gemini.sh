#!/usr/bin/env bash
# Diagnose Google Gemini API key + list models available to this project.
# Usage: ./scripts/diag-gemini.sh

set -euo pipefail

ENV_FILE="${CONVERZA_ENV:-/etc/converza/.env}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

KEY="${GOOGLE_API_KEY:-${GEMINI_API_KEY:-}}"
if [[ -z "$KEY" ]]; then
  echo "ERROR: GOOGLE_API_KEY (or GEMINI_API_KEY) not set in $ENV_FILE" >&2
  exit 1
fi

echo "==> List models (first 15 flash/pro entries)"
curl -fsS "https://generativelanguage.googleapis.com/v1beta/models?key=${KEY}" \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
names = [m.get('name','') for m in data.get('models', [])]
for n in sorted(names):
    if 'gemini' in n.lower() and ('flash' in n.lower() or 'pro' in n.lower()):
        print(' ', n.replace('models/', ''))
" | head -15

MODEL="${HERMES_GEMINI_MODEL:-gemini-2.0-flash}"
echo ""
echo "==> Test generateContent with model: $MODEL"
HTTP=$(curl -s -w "%{http_code}" -o /tmp/gemini-test.json \
  "https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Reply with exactly: GEMINI_OK"}]}]}')
echo "  HTTP $HTTP"
python3 -c "
import json
d=json.load(open('/tmp/gemini-test.json'))
if 'error' in d:
    print('  ERROR:', d['error'].get('message', d))
else:
    text=d['candidates'][0]['content']['parts'][0]['text']
    print('  reply:', text[:120])
"

echo ""
echo "==> Hermes model config (should match your LLM provider)"
docker compose -f docker-compose.prod.yml exec -T hermes sh -c \
  'grep -q "^GOOGLE_API_KEY=" /opt/hermes/.env 2>/dev/null && echo "  GOOGLE_API_KEY: yes" || echo "  GOOGLE_API_KEY: NO"; grep "^model:" -A4 /opt/hermes/config.yaml 2>/dev/null | head -8 || true' \
  2>/dev/null || echo "  (run from /opt/converza with hermes up)"

if [[ "$HTTP" == "429" ]]; then
  echo ""
  echo "  QUOTA: Gemini free tier exhausted (HTTP 429). Options:"
  echo "    1. Enable billing: https://aistudio.google.com/apikey"
  echo "    2. Wait for quota reset (~1 min per message above)"
  echo "    3. Use Anthropic: set CONVERZA_LLM_PROVIDER=anthropic + ANTHROPIC_API_KEY"
  echo "       then run ./scripts/fix-hermes-model.sh"
fi
