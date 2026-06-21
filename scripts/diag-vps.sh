#!/usr/bin/env bash
# Quick production diagnostics — run on the VPS from /opt/converza
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${CONVERZA_ENV:-/etc/converza/.env}"

echo "==> Docker containers"
docker compose -f "$COMPOSE_FILE" ps -a 2>/dev/null || docker-compose -f "$COMPOSE_FILE" ps -a

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
fi

echo ""
echo "==> Nginx error log (last 10 lines)"
tail -10 /var/log/nginx/error.log 2>/dev/null || true
