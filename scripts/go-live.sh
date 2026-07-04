#!/usr/bin/env bash
# Run ON THE VPS from /opt/converza after git pull.
# Registers webhooks, rebuilds containers, runs diagnostics.
#
#   cd /opt/converza && sudo ./scripts/go-live.sh
#
# Requires: /etc/converza/.env with all production values.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${CONVERZA_ENV:-/etc/converza/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
DOMAIN="${WEB_APP_URL:-https://getconverza.com}"
DOMAIN="${DOMAIN#https://}"
DOMAIN="${DOMAIN#http://}"
DOMAIN="${DOMAIN%/}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found. Copy .env.production.example and fill values." >&2
  exit 1
fi

echo "==> Loading $ENV_FILE"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

REQUIRED=(
  ENV
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  HERMES_API_KEY
  API_SERVER_KEY
  TELEGRAM_BOT_TOKEN
  TELEGRAM_APP_BOT_TOKEN
  TELEGRAM_APP_BOT_USERNAME
  JWT_SECRET
  WEB_APP_URL
  ALLOWED_ORIGINS
  ADMIN_TELEGRAM_IDS
)

echo "==> Checking required env vars"
MISSING=0
for key in "${REQUIRED[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "  MISSING: $key"
    MISSING=1
  else
    echo "  set: $key"
  fi
done

if [[ -n "${GROQ_API_KEY:-}" ]]; then
  echo "  set: GROQ_API_KEY (Groq — preferred)"
fi
if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "  set: ANTHROPIC_API_KEY (Claude)"
fi
if [[ -n "${GOOGLE_API_KEY:-}${GEMINI_API_KEY:-}" ]]; then
  echo "  set: GOOGLE_API_KEY / GEMINI_API_KEY (Gemini)"
fi

if [[ -z "${GROQ_API_KEY:-}" && -z "${ANTHROPIC_API_KEY:-}" && -z "${GOOGLE_API_KEY:-}" && -z "${GEMINI_API_KEY:-}" && -z "${OPENROUTER_API_KEY:-}" ]]; then
  echo "  MISSING: LLM provider (GROQ_API_KEY, GOOGLE_API_KEY, or ANTHROPIC_API_KEY)"
  MISSING=1
fi
if [[ "$MISSING" -eq 1 ]]; then
  echo "ERROR: Fill missing vars in $ENV_FILE" >&2
  exit 1
fi

if [[ -z "${CONVERZA_SUBSCRIPTION_PROVIDER_TOKEN:-}" ]]; then
  echo "WARN: CONVERZA_SUBSCRIPTION_PROVIDER_TOKEN not set — /subscribe will not send invoices"
fi
if [[ -z "${TELEGRAM_WEBHOOK_SECRET:-}" ]]; then
  echo "WARN: TELEGRAM_WEBHOOK_SECRET not set — webhooks accept any caller"
fi

echo "==> Git submodules (bot + web must match monorepo Dockerfiles)"
if [[ -f .gitmodules ]] || git submodule status 2>/dev/null | grep -q '^'; then
  git submodule update --init --recursive
fi

echo ""
echo "==> Docker build preflight"
if [[ ! -f converza_bot/requirements.txt ]]; then
  echo "ERROR: converza_bot/ is empty — run: git submodule update --init --recursive" >&2
  echo "       Or pull a monorepo commit that vendors bot/web (not submodule gitlinks)." >&2
  exit 1
fi
if ! grep -q 'converza_web/Converza_ai/requirements.txt' converza_web/Converza_ai/Dockerfile 2>/dev/null; then
  echo "ERROR: converza_web/Converza_ai/Dockerfile is outdated (expected monorepo COPY paths)." >&2
  echo "       cd converza_web/Converza_ai && git pull  OR  git submodule update --init --recursive" >&2
  exit 1
fi

echo ""
docker compose -f "$COMPOSE_FILE" up -d --build

echo ""
echo "==> Waiting for services (up to 180s)"
for i in $(seq 1 36); do
  if curl -fsS -m 3 http://127.0.0.1:8001/health >/dev/null 2>&1 \
     && curl -fsS -m 3 http://127.0.0.1:8000/health >/dev/null 2>&1; then
    echo "  web + bot health OK"
    break
  fi
  if [[ "$i" -eq 36 ]]; then
    echo "WARN: health checks timed out — check: docker compose -f $COMPOSE_FILE logs"
  fi
  sleep 5
done

if curl -fsS -m 5 http://127.0.0.1:8642/health >/dev/null 2>&1; then
  echo "  hermes health OK"
else
  echo "WARN: Hermes :8642 not responding yet (first start can take 2+ min)"
fi

echo ""
echo "==> Register Telegram webhooks"
export WEB_APP_URL="${WEB_APP_URL:-https://${DOMAIN}}"
chmod +x "$ROOT/scripts/set_telegram_webhooks.sh"
"$ROOT/scripts/set_telegram_webhooks.sh"

echo ""
echo "==> Fix bot command menus (override Hermes /new /model etc.)"
sleep 20
chmod +x "$ROOT/scripts/fix-bot-commands.sh"
"$ROOT/scripts/fix-bot-commands.sh" sales

echo ""
echo "==> Webhook status"
chmod +x "$ROOT/scripts/verify-webhooks.sh"
CONVERZA_ENV="$ENV_FILE" "$ROOT/scripts/verify-webhooks.sh"

echo ""
echo "==> Local ready checks"
curl -fsS http://127.0.0.1:8001/ready | head -c 800 || true
echo ""

echo ""
echo "==> Theater UI (/app)"
APP_HTML=$(curl -fsS -m 10 http://127.0.0.1:8001/app 2>/dev/null || echo "")
if echo "$APP_HTML" | grep -q 'Converza — Co-Pilot'; then
  echo "  OK  Theater UI served at /app"
elif echo "$APP_HTML" | grep -q 'Converza Dashboard'; then
  echo "  FAIL /app still legacy app.html — rebuild web: docker compose -f $COMPOSE_FILE build --no-cache web && docker compose -f $COMPOSE_FILE up -d web" >&2
  exit 1
else
  echo "  WARN /app did not return Theater UI — check web build logs" >&2
fi

echo ""
echo "==> BotFather reminders (manual)"
echo "  1. @ConverzaApp_bot → Bot Settings → Domain → ${DOMAIN}"
echo "  2. @ConverzaApp_bot → Payments → Click (subscription token)"
echo "  3. @ConverzaSales_bot → NO website domain (Business Chatbots only)"
echo ""
echo "==> Supabase: run migrations 004, 005, 006 if not applied (SQL Editor)"
echo ""
echo "==> Go-live deploy finished. Run from laptop:"
echo "     ./scripts/verify-production.sh https://${DOMAIN}"
echo "     Then complete deploy/PILOT.md manually."
