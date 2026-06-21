#!/usr/bin/env bash
# Register Telegram webhooks for both Converza bots.
# Usage: ./scripts/set_telegram_webhooks.sh
# Loads /etc/converza/.env on VPS, or converza_bot/.env locally.

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

if [[ -z "${WEB_APP_URL:-}" || -z "${TELEGRAM_BOT_TOKEN:-}" || -z "${TELEGRAM_APP_BOT_TOKEN:-}" ]]; then
  load_env "$ROOT/converza_bot/.env" || true
  load_env "$ENV_FILE" || true
fi

BASE="${WEB_APP_URL:?WEB_APP_URL required — set in /etc/converza/.env}"
BASE="${BASE%/}"
SECRET="${TELEGRAM_WEBHOOK_SECRET:-}"

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  echo "ERROR: TELEGRAM_BOT_TOKEN not set" >&2
  exit 1
fi
if [[ -z "${TELEGRAM_APP_BOT_TOKEN:-}" ]]; then
  echo "ERROR: TELEGRAM_APP_BOT_TOKEN not set" >&2
  exit 1
fi

sales_payload() {
  local url="$1"
  if [[ -n "$SECRET" ]]; then
    printf '{"url":"%s","secret_token":"%s","allowed_updates":["message","business_message","edited_business_message","business_connection","pre_checkout_query","callback_query"]}' "$url" "$SECRET"
  else
    printf '{"url":"%s","allowed_updates":["message","business_message","edited_business_message","business_connection","pre_checkout_query","callback_query"]}' "$url"
  fi
}

app_payload() {
  local url="$1"
  if [[ -n "$SECRET" ]]; then
    printf '{"url":"%s","secret_token":"%s","allowed_updates":["message","pre_checkout_query","callback_query"]}' "$url" "$SECRET"
  else
    printf '{"url":"%s","allowed_updates":["message","pre_checkout_query","callback_query"]}' "$url"
  fi
}

echo "Setting @ConverzaSales_bot webhook → ${BASE}/webhook/telegram"
curl -fsS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "$(sales_payload "${BASE}/webhook/telegram")"

echo ""
echo "Setting @ConverzaApp_bot webhook → ${BASE}/webhook/app"
curl -fsS "https://api.telegram.org/bot${TELEGRAM_APP_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "$(app_payload "${BASE}/webhook/app")"

echo ""
chmod +x "$ROOT/scripts/fix-sales-bot-commands.sh"
"$ROOT/scripts/fix-sales-bot-commands.sh"

echo ""
echo "Done."
