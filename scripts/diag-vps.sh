#!/usr/bin/env bash
# Quick production diagnostics — run on the VPS from /opt/converza
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

echo "==> Docker containers"
docker compose -f "$COMPOSE_FILE" ps -a 2>/dev/null || docker-compose -f "$COMPOSE_FILE" ps -a

echo ""
echo "==> Listening ports (8000 bot, 8001 web)"
ss -tlnp 2>/dev/null | grep -E ':8000|:8001' || netstat -tlnp 2>/dev/null | grep -E ':8000|:8001' || true

echo ""
echo "==> Local health checks"
for url in "http://127.0.0.1:8000/health" "http://127.0.0.1:8001/health"; do
  echo -n "  $url → "
  curl -sS -m 5 "$url" 2>&1 || echo "FAILED"
  echo ""
done

echo ""
echo "==> Web container logs (last 60 lines)"
docker compose -f "$COMPOSE_FILE" logs web --tail 60 2>/dev/null || docker-compose -f "$COMPOSE_FILE" logs --tail 60 web

echo ""
echo "==> Required env vars (names only)"
for key in ENV JWT_SECRET SUPABASE_URL TELEGRAM_BOT_TOKEN KIE_API_KEY; do
  if grep -q "^${key}=" /etc/converza/.env 2>/dev/null; then
    echo "  $key=set"
  else
    echo "  $key=MISSING"
  fi
done

echo ""
echo "==> Webhook proxy (expects 200/403, not 502)"
curl -sS -m 5 -X POST "https://getconverza.com/webhook/telegram" \
  -H "Content-Type: application/json" \
  -d '{"update_id":1}' 2>&1 | head -1 || true

echo ""
echo "==> Nginx error log (last 10 lines)"
tail -10 /var/log/nginx/error.log 2>/dev/null || true
