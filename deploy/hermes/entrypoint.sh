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

# Hermes reads provider keys from ${HERMES_HOME}/.env
HERMES_ENV="${HERMES_HOME}/.env"
touch "${HERMES_ENV}"
for var in GOOGLE_API_KEY GEMINI_API_KEY ANTHROPIC_API_KEY OPENROUTER_API_KEY \
  SUPABASE_URL SUPABASE_SERVICE_KEY TELEGRAM_BOT_TOKEN; do
  val="${!var:-}"
  if [[ -n "$val" ]]; then
    if grep -q "^${var}=" "${HERMES_ENV}" 2>/dev/null; then
      sed -i "s|^${var}=.*|${var}=${val}|" "${HERMES_ENV}"
    else
      echo "${var}=${val}" >> "${HERMES_ENV}"
    fi
  fi
done

if ! command -v hermes >/dev/null 2>&1; then
  echo "Installing Hermes Agent (runtime fallback)..."
  env -u PYTHONPATH -u PYTHONHOME bash -c \
    'curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash -s -- --skip-setup --skip-browser --no-skills --non-interactive'
fi

if ! command -v hermes >/dev/null 2>&1; then
  echo "ERROR: hermes not found at /usr/local/bin/hermes after install. Check RAM (2GB+ recommended)." >&2
  exit 1
fi

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

echo "Starting Hermes gateway (API :${API_SERVER_PORT}, MCP converza)..."
exec hermes gateway
