#!/usr/bin/env bash
# Register Telegram webhooks for both Converza bots.
# Usage: WEB_APP_URL=https://getconverza.com TELEGRAM_WEBHOOK_SECRET=... \
#   TELEGRAM_BOT_TOKEN=... TELEGRAM_APP_BOT_TOKEN=... ./scripts/set_telegram_webhooks.sh

set -euo pipefail

BASE="${WEB_APP_URL:?WEB_APP_URL required}"
BASE="${BASE%/}"
SECRET="${TELEGRAM_WEBHOOK_SECRET:-}"

sales_payload() {
  local url="$1"
  if [[ -n "$SECRET" ]]; then
    printf '{"url":"%s","secret_token":"%s","allowed_updates":["message","business_message","business_connection","pre_checkout_query","callback_query"]}' "$url" "$SECRET"
  else
    printf '{"url":"%s","allowed_updates":["message","business_message","business_connection","pre_checkout_query","callback_query"]}' "$url"
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
echo "Done."
