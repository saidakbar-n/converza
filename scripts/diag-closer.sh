#!/usr/bin/env bash
# Test DM Closer Hermes path for an org (run on VPS from /opt/converza).
# Usage: ./scripts/diag-closer.sh <org_id> [prospect_uuid]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ORG_ID="${1:-}"
PROSPECT_ID="${2:-}"

if [[ -z "$ORG_ID" ]]; then
  echo "Usage: $0 <org_id> [prospect_uuid]" >&2
  echo "  prospect_uuid optional — omit to skip message history" >&2
  exit 1
fi

docker compose -f "$ROOT/$COMPOSE_FILE" exec -T bot python3 - <<PY
import asyncio
import json
import uuid

from agents.searcher import get_conversation_history, get_organization
from converza_agent.runtime import run_dm_closer_json

org_id = "${ORG_ID}"
prospect_id = "${PROSPECT_ID}".strip() or None

async def main():
    org = await get_organization(org_id)
    brand = org.get("brand_context") or {}
    history = []
    if prospect_id:
        try:
            uuid.UUID(prospect_id)
            history = await get_conversation_history(org_id, prospect_id, limit=5)
        except ValueError:
            print("WARN: prospect_id is not a UUID — skipping message history")
    payload = {
        "org_id": org_id,
        "prospect_id": prospect_id or str(uuid.uuid4()),
        "chat_id": 0,
        "inbound_text": "Salom, narx qancha?",
        "brand_context": brand,
        "message_history": history,
        "payments_enabled": False,
    }
    print("==> brand_name:", (brand.get("brand_name") or "(missing)"))
    print("==> DM closer (Groq direct when GROQ_API_KEY set)")
    try:
        result = await run_dm_closer_json(
            json.dumps(payload, ensure_ascii=False),
            max_tokens=600,
        )
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except Exception as exc:
        print("ERROR:", exc)
        raise SystemExit(1)

asyncio.run(main())
PY

echo ""
echo "If ERROR above, also check: docker compose -f $COMPOSE_FILE logs hermes --tail 40"
