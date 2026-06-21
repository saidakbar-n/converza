#!/usr/bin/env bash
# Show webhook status for both Converza bots (getWebhookInfo).
# Loads tokens from converza_bot/.env or /etc/converza/.env unless exported.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${CONVERZA_ENV:-/etc/converza/.env}"

load_env() {
  local f="$1"
  [[ -f "$f" ]] || return 1
  set -a
  # shellcheck disable=SC1090
  source "$f"
  set +a
  return 0
}

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" || -z "${TELEGRAM_APP_BOT_TOKEN:-}" ]]; then
  load_env "$ROOT/converza_bot/.env" || true
  load_env "$ENV_FILE" || true
fi

# /etc/converza/.env wins on VPS (converza_bot/.env may be a stale partial copy)
if [[ -f "$ENV_FILE" ]]; then
  load_env "$ENV_FILE" || true
fi

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  echo "ERROR: TELEGRAM_BOT_TOKEN not set" >&2
  exit 1
fi
if [[ -z "${TELEGRAM_APP_BOT_TOKEN:-}" ]]; then
  echo "ERROR: TELEGRAM_APP_BOT_TOKEN not set" >&2
  exit 1
fi

echo "==> @ConverzaSales_bot (TELEGRAM_BOT_TOKEN)"
curl -fsS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | python3 -m json.tool 2>/dev/null \
  || curl -fsS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"

echo ""
echo "==> @ConverzaApp_bot (TELEGRAM_APP_BOT_TOKEN)"
curl -fsS "https://api.telegram.org/bot${TELEGRAM_APP_BOT_TOKEN}/getWebhookInfo" | python3 -m json.tool 2>/dev/null \
  || curl -fsS "https://api.telegram.org/bot${TELEGRAM_APP_BOT_TOKEN}/getWebhookInfo"

echo ""
