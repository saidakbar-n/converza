#!/bin/bash
set -euo pipefail

export HERMES_HOME="${HERMES_HOME:-/opt/hermes}"
export API_SERVER_ENABLED="${API_SERVER_ENABLED:-true}"
export API_SERVER_HOST="${API_SERVER_HOST:-0.0.0.0}"
export API_SERVER_PORT="${API_SERVER_PORT:-8642}"
export PYTHONPATH="${PYTHONPATH:-/app}"

if [[ -z "${API_SERVER_KEY:-}" && -n "${HERMES_API_KEY:-}" ]]; then
  export API_SERVER_KEY="$HERMES_API_KEY"
fi

if [[ -z "${API_SERVER_KEY:-}" ]]; then
  echo "HERMES_API_KEY (or API_SERVER_KEY) is required" >&2
  exit 1
fi

if ! command -v hermes >/dev/null 2>&1; then
  echo "Installing Hermes Agent..."
  curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash -s -- --no-onboard
  export PATH="${HERMES_HOME}/bin:${PATH}"
fi

HERMES_CONFIG="${HERMES_HOME}/config.yaml"
if [[ ! -f "$HERMES_CONFIG" ]]; then
  mkdir -p "${HERMES_HOME}/skills"
  cp -r /app/hermes-skills/* "${HERMES_HOME}/skills/" 2>/dev/null || true
  if [[ -f /app/hermes-config.yaml.template ]]; then
    cat /app/hermes-config.yaml.template >> "$HERMES_CONFIG"
  fi
fi

echo "Starting Hermes gateway (API :${API_SERVER_PORT}, MCP converza)..."
exec hermes gateway
