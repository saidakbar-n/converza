#!/usr/bin/env bash
# Rebuild and restart only the web container (FastAPI + static/theater).
# Run ON THE VPS from /opt/converza:
#   sudo ./scripts/redeploy-web.sh
#
# Use after git pull when /app still shows the legacy dashboard.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

echo "==> Git at $(git log -1 --oneline)"
if ! test -f converza_web/Converza_ai/static/theater/index.html; then
  echo "ERROR: static/theater/ missing — run: ./scripts/build-theater.sh && git add static/theater" >&2
  exit 1
fi
if ! grep -q 'static/theater/index.html' converza_web/Converza_ai/Dockerfile 2>/dev/null; then
  echo "ERROR: Dockerfile outdated — git pull" >&2
  exit 1
fi

echo ""
echo "==> Building web image (FastAPI + pre-built static/theater)"
docker compose -f "$COMPOSE_FILE" build web

echo ""
echo "==> Restarting web container"
docker compose -f "$COMPOSE_FILE" up -d web

echo ""
echo "==> Waiting for :8001 (up to 90s)"
for i in $(seq 1 18); do
  if curl -fsS -m 3 http://127.0.0.1:8001/health >/dev/null 2>&1; then
    echo "  health OK"
    break
  fi
  if [[ "$i" -eq 18 ]]; then
    echo "ERROR: web health timed out — logs:" >&2
    docker compose -f "$COMPOSE_FILE" logs web --tail 50
    exit 1
  fi
  sleep 5
done

echo ""
echo "==> Theater build inside container"
if docker compose -f "$COMPOSE_FILE" exec -T web test -f static/theater/index.html; then
  echo "  OK  static/theater/index.html exists"
else
  echo "  FAIL static/theater/index.html missing — web build stage failed" >&2
  docker compose -f "$COMPOSE_FILE" logs web --tail 30
  exit 1
fi

echo ""
echo "==> /app response"
APP_HTML=$(curl -fsSL -m 10 http://127.0.0.1:8001/app 2>/dev/null || echo "")
if echo "$APP_HTML" | grep -q 'Converza — Co-Pilot'; then
  echo "  OK  Theater UI at /app"
elif echo "$APP_HTML" | grep -q 'Converza Dashboard'; then
  echo "  FAIL still legacy dashboard — image may be stale; check docker images" >&2
  exit 1
else
  echo "  WARN unexpected /app body (first 200 chars):"
  echo "$APP_HTML" | head -c 200
  echo ""
fi

echo ""
echo "==> Redeploy OK. From laptop:"
echo "     ./scripts/verify-production.sh https://getconverza.com"
