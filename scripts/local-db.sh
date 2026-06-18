#!/usr/bin/env bash
# Local PostgreSQL + PostgREST for Converza dev (Supabase-compatible REST API).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="docker compose -f $ROOT/docker-compose.local.yml"

cmd="${1:-status}"

case "$cmd" in
  start)
    chmod +x "$ROOT/docker/local/02-schema.sh"
    $COMPOSE up -d
    echo "Waiting for API..."
    for i in $(seq 1 30); do
      if curl -sf "http://127.0.0.1:54321/health" >/dev/null 2>&1; then
        break
      fi
      sleep 1
    done
    if ! curl -sf "http://127.0.0.1:54321/health" >/dev/null 2>&1; then
      echo "API did not become ready. Check: $COMPOSE logs"
      exit 1
    fi
    echo ""
    echo "Local DB is up."
    echo "  REST API:  http://127.0.0.1:54321  (same shape as Supabase)"
    echo "  Postgres:  postgresql://postgres:postgres@127.0.0.1:5433/converza"
    echo ""
    echo "Next:"
    echo "  cp .env.local.example .env.local"
    echo "  # restart bot (8000) and web (8001) so they pick up .env.local"
    echo "  ./scripts/local-db.sh test"
    ;;
  stop)
    $COMPOSE down
    echo "Local DB stopped."
    ;;
  reset)
    $COMPOSE down -v
    chmod +x "$ROOT/docker/local/02-schema.sh"
    $COMPOSE up -d
    echo "Database wiped and re-initialized."
    ;;
  logs)
    $COMPOSE logs -f "${2:-}"
    ;;
  test)
    cd "$ROOT/converza_bot"
    if [[ -f venv/bin/activate ]]; then source venv/bin/activate; fi
    if [[ ! -f "$ROOT/.env.local" ]]; then
      echo "Missing $ROOT/.env.local — run: cp .env.local.example .env.local"
      exit 1
    fi
    PYTHONPATH="$ROOT/converza_bot" python3 - <<'PY'
from services.brand_passport import upsert_passport, fetch_passport_by_org

org_id = "1970617659"
saved = upsert_passport(org_id, {
    "brand_name": "Local Test Brand",
    "target_audience": "test",
    "core_offer": "test offer",
})
row = fetch_passport_by_org(org_id)
assert row and row.get("brand_name") == "Local Test Brand", row
print("OK — brand_passports write/read:", {"brand_name": row["brand_name"], "org_id": org_id})
PY
    ;;
  status)
    $COMPOSE ps 2>/dev/null || true
    curl -sf "http://127.0.0.1:54321/health" && echo " API: healthy" || echo " API: not running (./scripts/local-db.sh start)"
    ;;
  *)
    echo "Usage: $0 {start|stop|reset|status|test|logs [service]}"
    exit 1
    ;;
esac
