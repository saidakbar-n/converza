#!/usr/bin/env bash
#
# Manage the Converza Telegram webhook.
#
# The bot token is read from the environment — it is NEVER hardcoded here.
# Resolution order for the token:
#   1. $TELEGRAM_BOT_TOKEN (already exported in your shell), else
#   2. TELEGRAM_BOT_TOKEN= line inside converza_bot/.env (auto-loaded).
#
# The public domain is taken from $1 (first CLI arg) or $WEBHOOK_DOMAIN.
# The webhook is registered to:  https://<DOMAIN>/webhook/telegram
#
# Usage:
#   scripts/register_webhook.sh set    <domain>   # register the webhook
#   scripts/register_webhook.sh info              # getWebhookInfo
#   scripts/register_webhook.sh delete            # deleteWebhook
#
# Examples:
#   scripts/register_webhook.sh set bluegill-key-precisely.ngrok-free.app
#   WEBHOOK_DOMAIN=app.example.com scripts/register_webhook.sh set
#   scripts/register_webhook.sh info
#   scripts/register_webhook.sh delete
#
# Notes:
#   - Pass the bare host (no scheme, no trailing slash). https:// is enforced;
#     Telegram requires HTTPS for webhooks.
#   - This script talks to the public Telegram Bot API. Run it yourself when
#     you are ready to go live.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BOT_ENV="${REPO_ROOT}/converza_bot/.env"

# --- Resolve the bot token (env first, then converza_bot/.env) --------------
if [[ -z "${TELEGRAM_BOT_TOKEN:-}" && -f "${BOT_ENV}" ]]; then
    # Extract the value without sourcing the whole file (avoids side effects).
    TELEGRAM_BOT_TOKEN="$(grep -E '^TELEGRAM_BOT_TOKEN=' "${BOT_ENV}" | tail -n1 | cut -d= -f2-)"
fi

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
    echo "ERROR: TELEGRAM_BOT_TOKEN is not set (export it or add it to converza_bot/.env)." >&2
    exit 1
fi

API="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}"

# --- Helpers ----------------------------------------------------------------
require_domain() {
    local domain="${1:-${WEBHOOK_DOMAIN:-}}"
    if [[ -z "${domain}" ]]; then
        echo "ERROR: domain required. Pass it as the 2nd arg or set \$WEBHOOK_DOMAIN." >&2
        echo "       e.g. scripts/register_webhook.sh set app.example.com" >&2
        exit 1
    fi
    # Strip any scheme and trailing slash the caller may have included.
    domain="${domain#http://}"
    domain="${domain#https://}"
    domain="${domain%/}"
    echo "${domain}"
}

cmd="${1:-}"

case "${cmd}" in
    set)
        DOMAIN="$(require_domain "${2:-}")"
        WEBHOOK_URL="https://${DOMAIN}/webhook/telegram"
        echo "Registering webhook -> ${WEBHOOK_URL}"
        SECRET="${TELEGRAM_WEBHOOK_SECRET:-}"
        if [[ -n "${SECRET}" ]]; then
            echo "Using TELEGRAM_WEBHOOK_SECRET from environment"
            curl -fsS -X POST "${API}/setWebhook" \
                -d "url=${WEBHOOK_URL}" \
                -d "secret_token=${SECRET}" \
                -d 'allowed_updates=["message","callback_query","business_connection","business_message","pre_checkout_query"]'
        else
            echo "WARN: TELEGRAM_WEBHOOK_SECRET not set — webhook will accept any caller"
            curl -fsS -X POST "${API}/setWebhook" \
                -d "url=${WEBHOOK_URL}" \
                -d 'allowed_updates=["message","callback_query","business_connection","business_message","pre_checkout_query"]'
        fi
        echo
        ;;
    info)
        echo "Fetching webhook info..."
        curl -fsS "${API}/getWebhookInfo"
        echo
        ;;
    delete)
        echo "Deleting webhook (drop_pending_updates=true)..."
        curl -fsS -X POST "${API}/deleteWebhook" -d "drop_pending_updates=true"
        echo
        ;;
    *)
        echo "Usage: $0 {set <domain>|info|delete}" >&2
        echo "  set <domain>   register https://<domain>/webhook/telegram" >&2
        echo "  info           show current webhook status (getWebhookInfo)" >&2
        echo "  delete         remove the webhook (deleteWebhook)" >&2
        exit 2
        ;;
esac
