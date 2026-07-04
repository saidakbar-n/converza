#!/usr/bin/env bash
# Quick production diagnostics — run on the VPS from /opt/converza
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${CONVERZA_ENV:-/etc/converza/.env}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

echo "==> Docker containers (need hermes + bot + web all Up)"
docker compose -f "$COMPOSE_FILE" ps -a 2>/dev/null || docker-compose -f "$COMPOSE_FILE" ps -a
if ! docker compose -f "$COMPOSE_FILE" ps --status running 2>/dev/null | grep -q converza-web; then
  echo "  WARN: converza-web not running — Telegram webhooks will 502 until web is up"
  echo "  Fix: docker compose -f $COMPOSE_FILE up -d web"
fi

echo ""
echo "==> Listening ports (8642 hermes, 8000 bot, 8001 web)"
ss -tlnp 2>/dev/null | grep -E ':8642|:8000|:8001' || netstat -tlnp 2>/dev/null | grep -E ':8642|:8000|:8001' || true

echo ""
echo "==> Local health checks"
for url in "http://127.0.0.1:8642/health" "http://127.0.0.1:8000/health" "http://127.0.0.1:8001/health" "http://127.0.0.1:8001/ready"; do
  echo -n "  $url → "
  curl -sS -m 5 "$url" 2>&1 | head -c 200 || echo "FAILED"
  echo ""
done

echo ""
echo "==> Container logs (last 30 lines each)"
for svc in hermes bot web; do
  echo "--- $svc ---"
  docker compose -f "$COMPOSE_FILE" logs "$svc" --tail 30 2>/dev/null || true
done

echo ""
echo "==> Required env vars (names only)"
for key in ENV JWT_SECRET SUPABASE_URL HERMES_API_KEY ANTHROPIC_API_KEY \
  TELEGRAM_BOT_TOKEN TELEGRAM_APP_BOT_TOKEN TELEGRAM_WEBHOOK_SECRET \
  CONVERZA_SUBSCRIPTION_PROVIDER_TOKEN WEB_APP_URL; do
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    echo "  $key=set"
  else
    echo "  $key=MISSING"
  fi
done

echo ""
echo "==> Webhook proxy (expects not 502)"
for path in webhook/telegram webhook/app; do
  echo -n "  POST /$path → "
  curl -sS -m 5 -o /dev/null -w "%{http_code}" -X POST "https://getconverza.com/$path" \
    -H "Content-Type: application/json" \
    -d '{"update_id":1}' 2>&1 || echo "fail"
  echo ""
done

if [[ -x "$(dirname "$0")/verify-webhooks.sh" ]]; then
  echo ""
  echo "==> Telegram getWebhookInfo"
  CONVERZA_ENV="$ENV_FILE" "$(dirname "$0")/verify-webhooks.sh" || true
  SALES_URL=$(curl -fsS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" 2>/dev/null \
    | python3 -c "import json,sys; print(json.load(sys.stdin).get('result',{}).get('url',''))" 2>/dev/null || true)
  if [[ -z "${SALES_URL:-}" ]]; then
    echo ""
    echo "  FAIL: @ConverzaSales_bot webhook URL is EMPTY — Hermes may have deleted it."
    echo "  Fix: docker compose -f $COMPOSE_FILE up -d --build hermes && ./scripts/set_telegram_webhooks.sh"
  fi
fi

echo ""
echo "==> Theater UI (/app)"
APP_HTML=$(curl -fsSL -m 10 http://127.0.0.1:8001/app 2>/dev/null || echo "")
HEALTH=$(curl -fsS -m 5 http://127.0.0.1:8001/health 2>/dev/null || echo '{}')
echo "  /health → $HEALTH"
if echo "$HEALTH" | grep -q '"theater_ui":true'; then
  echo "  OK  theater_ui baked in image"
elif echo "$HEALTH" | grep -q '"theater_ui":false'; then
  echo "  FAIL theater_ui=false — run: sudo ./scripts/redeploy-web.sh" >&2
fi
if echo "$APP_HTML" | grep -q 'Converza — Co-Pilot'; then
  echo "  OK  /app serves Theater UI"
elif echo "$APP_HTML" | grep -q 'Converza Dashboard'; then
  echo "  FAIL /app still legacy dashboard" >&2
else
  echo "  /app body (first 120 chars): $(echo "$APP_HTML" | head -c 120)"
fi

