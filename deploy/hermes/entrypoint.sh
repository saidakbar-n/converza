#!/bin/bash
set -euo pipefail

export HERMES_HOME="${HERMES_HOME:-/opt/hermes}"
export PATH="/usr/local/bin:/opt/hermes/bin:${PATH}"
export API_SERVER_ENABLED="${API_SERVER_ENABLED:-true}"
export API_SERVER_HOST="${API_SERVER_HOST:-0.0.0.0}"
export API_SERVER_PORT="${API_SERVER_PORT:-8642}"
export PYTHONPATH="${PYTHONPATH:-/app}"

if [[ -z "${API_SERVER_KEY:-}" && -n "${HERMES_API_KEY:-}" ]]; then
  export API_SERVER_KEY="$HERMES_API_KEY"
fi

if [[ -z "${API_SERVER_KEY:-}" ]]; then
  echo "HERMES_API_KEY (or API_SERVER_KEY) is required in /etc/converza/.env" >&2
  exit 1
fi

mkdir -p "${HERMES_HOME}/skills"

# Hermes reads provider keys from ${HERMES_HOME}/.env (never Telegram — Converza owns webhooks).
HERMES_ENV="${HERMES_HOME}/.env"
touch "${HERMES_ENV}"
# Strip Telegram vars so Hermes does not long-poll @ConverzaSales_bot (causes pairing spam).
sed -i '/^TELEGRAM_/d' "${HERMES_ENV}" 2>/dev/null || true
for var in GOOGLE_API_KEY GEMINI_API_KEY ANTHROPIC_API_KEY OPENROUTER_API_KEY \
  SUPABASE_URL SUPABASE_SERVICE_KEY; do
  val="${!var:-}"
  if [[ -n "$val" ]]; then
    if grep -q "^${var}=" "${HERMES_ENV}" 2>/dev/null; then
      sed -i "s|^${var}=.*|${var}=${val}|" "${HERMES_ENV}"
    else
      echo "${var}=${val}" >> "${HERMES_ENV}"
    fi
  fi
done

HERMES_CONFIG="${HERMES_HOME}/config.yaml"
if [[ ! -f "$HERMES_CONFIG" ]] || ! grep -q "mcp_servers:" "$HERMES_CONFIG" 2>/dev/null; then
  cp -r /app/hermes-skills/* "${HERMES_HOME}/skills/" 2>/dev/null || true
  if [[ -f /app/hermes-config.yaml.template ]]; then
    if [[ ! -f "$HERMES_CONFIG" ]]; then
      cp /app/hermes-config.yaml.template "$HERMES_CONFIG"
    elif ! grep -q "mcp_servers:" "$HERMES_CONFIG" 2>/dev/null; then
      cat /app/hermes-config.yaml.template >> "$HERMES_CONFIG"
    fi
  fi
fi

# Override Gemini model from env (fixes 404 when default model unavailable for this API key).
GEMINI_MODEL="${HERMES_GEMINI_MODEL:-${GEMINI_MODEL:-}}"
if [[ -n "$GEMINI_MODEL" && -f "$HERMES_CONFIG" ]]; then
  sed -i "/^[[:space:]]*default:/ s/default: .*/default: ${GEMINI_MODEL}/" "$HERMES_CONFIG" 2>/dev/null || true
fi

if ! command -v hermes >/dev/null 2>&1 || [[ ! -x /usr/local/bin/hermes ]]; then
  echo "ERROR: /usr/local/bin/hermes missing. VPS code is stale or image build failed." >&2
  echo "  cd /opt/converza && git fetch origin && git reset --hard origin/main && git clean -fd" >&2
  echo "  docker compose -f docker-compose.prod.yml build --no-cache hermes" >&2
  exit 1
fi

if [[ -f "$HERMES_CONFIG" ]] && ! grep -q "platforms:" "$HERMES_CONFIG" 2>/dev/null; then
  cat >> "$HERMES_CONFIG" <<'EOF'

# Converza: Telegram handled by converza_bot webhooks, not Hermes polling
platforms:
  telegram:
    enabled: false
EOF
fi
# Hermes may persist telegram: enabled: true — force off every start.
if [[ -f "$HERMES_CONFIG" ]] && grep -q 'telegram:' "$HERMES_CONFIG" 2>/dev/null; then
  sed -i '/bot_token:/d' "$HERMES_CONFIG" 2>/dev/null || true
  sed -i '/^[[:space:]]*telegram:/,/^[[:space:]]*[a-z_]*:/ s/enabled: true/enabled: false/' "$HERMES_CONFIG" 2>/dev/null || true
  sed -i '/telegram:/,/enabled:/ s/enabled: true/enabled: false/' "$HERMES_CONFIG" 2>/dev/null || true
fi

# docker compose env_file still injects TELEGRAM_BOT_TOKEN — Hermes polls and deletes webhooks.
for tgvar in TELEGRAM_BOT_TOKEN TELEGRAM_APP_BOT_TOKEN TELEGRAM_ALLOWED_USERS \
  TELEGRAM_WEBHOOK_SECRET TELEGRAM_BOT_USERNAME TELEGRAM_APP_BOT_USERNAME \
  TELEGRAM_HITL_BOT_TOKEN; do
  unset "$tgvar" || true
done

echo "Starting Hermes gateway (API :${API_SERVER_PORT}, MCP converza; Telegram disabled)..."
exec env -u TELEGRAM_BOT_TOKEN -u TELEGRAM_APP_BOT_TOKEN -u TELEGRAM_ALLOWED_USERS \
  -u TELEGRAM_WEBHOOK_SECRET -u TELEGRAM_BOT_USERNAME -u TELEGRAM_APP_BOT_USERNAME \
  -u TELEGRAM_HITL_BOT_TOKEN \
  hermes gateway
