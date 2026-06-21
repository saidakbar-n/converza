#!/usr/bin/env bash
# Test Groq API key (direct) + Hermes health.
set -euo pipefail

ENV_FILE="${CONVERZA_ENV:-/etc/converza/.env}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

KEY="${GROQ_API_KEY:-}"
MODEL="${HERMES_GROQ_MODEL:-llama-3.3-70b-versatile}"

if [[ -z "$KEY" ]]; then
  echo "ERROR: GROQ_API_KEY not set in $ENV_FILE" >&2
  exit 1
fi

echo "==> Groq chat completion (model: $MODEL)"
HTTP=$(curl -s -w "%{http_code}" -o /tmp/groq-test.json \
  "https://api.groq.com/openai/v1/chat/completions" \
  -H "Authorization: Bearer ${KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"${MODEL}\",\"messages\":[{\"role\":\"user\",\"content\":\"Reply with exactly: GROQ_OK\"}],\"max_tokens\":16,\"temperature\":0}")

echo "  HTTP $HTTP"
python3 -c "
import json, sys
d=json.load(open('/tmp/groq-test.json'))
if 'error' in d:
    print('  ERROR:', d['error'].get('message', d))
    sys.exit(1)
text=d['choices'][0]['message']['content']
print('  reply:', text[:120])
if 'GROQ_OK' not in text.upper():
    sys.exit('unexpected reply')
print('  OK  Groq API responding')
"

echo ""
echo "==> Hermes health"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
chmod +x "$ROOT/scripts/wait-hermes.sh"
"$ROOT/scripts/wait-hermes.sh"
curl -fsS http://127.0.0.1:8642/health && echo ""
