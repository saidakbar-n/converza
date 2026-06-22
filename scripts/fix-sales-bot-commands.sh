#!/usr/bin/env bash
# Reset @ConverzaSales_bot menu to Converza /config, /start, /help (wipes Hermes commands).
# Run after hermes restart or when the sales bot menu shows /new, /model, etc.
#
#   ./scripts/fix-sales-bot-commands.sh

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

load_env "$ROOT/converza_bot/.env" || true
load_env "$ENV_FILE" || true

TOKEN="${TELEGRAM_BOT_TOKEN:-}"
if [[ -z "$TOKEN" ]]; then
  echo "ERROR: TELEGRAM_BOT_TOKEN not set" >&2
  exit 1
fi

API="https://api.telegram.org/bot${TOKEN}"

echo "==> Clearing all @ConverzaSales_bot command scopes"
curl -fsS "${API}/deleteMyCommands" -H "Content-Type: application/json" -d '{}'
curl -fsS "${API}/deleteMyCommands" \
  -H "Content-Type: application/json" \
  -d '{"scope":{"type":"all_private_chats"}}'
curl -fsS "${API}/deleteMyCommands" \
  -H "Content-Type: application/json" \
  -d '{"scope":{"type":"all_group_chats"}}'
if [[ -n "${ADMIN_TELEGRAM_IDS:-}" ]]; then
  IFS=',' read -ra ADMINS <<< "$ADMIN_TELEGRAM_IDS"
  for aid in "${ADMINS[@]}"; do
    aid="${aid// /}"
    [[ -n "$aid" ]] || continue
    curl -fsS "${API}/deleteMyCommands" \
      -H "Content-Type: application/json" \
      -d "{\"scope\":{\"type\":\"chat\",\"chat_id\":${aid}}}" || true
  done
fi

echo "==> Setting Converza sales bot commands (/config, /start, /help)"
curl -fsS "${API}/setMyCommands" \
  -H "Content-Type: application/json" \
  -d '{"commands":[{"command":"config","description":"DM Closer ohangini tanlash"},{"command":"start","description":"Bu bot haqida"},{"command":"help","description":"Yordam"}]}'

echo ""
echo "==> Current menu:"
curl -fsS "${API}/getMyCommands" | python3 -m json.tool 2>/dev/null || curl -fsS "${API}/getMyCommands"
echo ""
echo "Done."
