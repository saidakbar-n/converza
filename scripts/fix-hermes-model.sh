#!/usr/bin/env bash
# Patch Hermes model provider in the running container (gemini vs anthropic).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${CONVERZA_ENV:-/etc/converza/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

cd "$ROOT"
docker compose -f "$COMPOSE_FILE" exec -T hermes python3 /app/deploy/hermes/patch_model.py /opt/hermes/config.yaml
echo ""
docker compose -f "$COMPOSE_FILE" exec -T hermes grep -A3 '^model:' /opt/hermes/config.yaml || true
echo ""
echo "Restarting hermes..."
docker compose -f "$COMPOSE_FILE" restart hermes
chmod +x "$ROOT/scripts/wait-hermes.sh"
echo ""
echo "Waiting for Hermes API..."
"$ROOT/scripts/wait-hermes.sh" || {
  docker compose -f "$COMPOSE_FILE" logs hermes --tail 40
  exit 1
}
