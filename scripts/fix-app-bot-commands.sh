#!/usr/bin/env bash
# Reset @ConverzaApp_bot menu to Converza commands (wipes Hermes /new, /model, etc.).
# Run after hermes restart or when the app bot menu shows Hermes commands.
#
#   ./scripts/fix-app-bot-commands.sh

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

TOKEN="${TELEGRAM_APP_BOT_TOKEN:-}"
if [[ -z "$TOKEN" ]]; then
  echo "ERROR: TELEGRAM_APP_BOT_TOKEN not set" >&2
  exit 1
fi

API="https://api.telegram.org/bot${TOKEN}"

APP_COMMANDS='[
  {"command":"start","description":"Converza onboarding"},
  {"command":"help","description":"Yordam"},
  {"command":"status","description":"Obuna va sozlama holati"},
  {"command":"profile","description":"Brend pasporti"},
  {"command":"subscribe","description":"Oylik obuna to'\''lovi"},
  {"command":"report","description":"Kunlik hisobot"},
  {"command":"fill","description":"Pasportni to'\''ldirish"}
]'

APP_ADMIN_COMMANDS='[
  {"command":"start","description":"Converza onboarding"},
  {"command":"help","description":"Yordam"},
  {"command":"status","description":"Obuna va sozlama holati"},
  {"command":"profile","description":"Brend pasporti"},
  {"command":"subscribe","description":"Oylik obuna to'\''lovi"},
  {"command":"report","description":"Kunlik hisobot"},
  {"command":"fill","description":"Pasportni to'\''ldirish"},
  {"command":"admin","description":"Admin panel"},
  {"command":"pending","description":"Kutilayotgan arizalar"},
  {"command":"approve","description":"Arizani tasdiqlash"},
  {"command":"reject","description":"Arizani rad etish"}
]'

echo "==> Clearing all @ConverzaApp_bot command scopes"
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

echo "==> Setting Converza app bot commands"
curl -fsS "${API}/setMyCommands" \
  -H "Content-Type: application/json" \
  -d "{\"commands\":${APP_COMMANDS}}"

if [[ -n "${ADMIN_TELEGRAM_IDS:-}" ]]; then
  IFS=',' read -ra ADMINS <<< "$ADMIN_TELEGRAM_IDS"
  for aid in "${ADMINS[@]}"; do
    aid="${aid// /}"
    [[ -n "$aid" ]] || continue
    echo "==> Setting admin commands for chat ${aid}"
    curl -fsS "${API}/setMyCommands" \
      -H "Content-Type: application/json" \
      -d "{\"commands\":${APP_ADMIN_COMMANDS},\"scope\":{\"type\":\"chat\",\"chat_id\":${aid}}}" || true
  done
fi

echo ""
echo "==> Current menu:"
curl -fsS "${API}/getMyCommands" | python3 -m json.tool 2>/dev/null || curl -fsS "${API}/getMyCommands"
echo ""
echo "Done."
