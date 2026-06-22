#!/usr/bin/env bash
# Smoke-test Co-Pilot LLM path (run on VPS from /opt/converza).
# Usage: ./scripts/diag-copilot.sh <org_id>

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ORG_ID="${1:-}"

if [[ -z "$ORG_ID" ]]; then
  echo "Usage: $0 <org_id>" >&2
  exit 1
fi

docker compose -f "$ROOT/$COMPOSE_FILE" exec -T web python3 - <<PY
import asyncio
import json

from converza_agent.prompts.copilot import COPILOT_SYSTEM_PROMPT
from converza_agent.runtime import stream_copilot
from services.brand_passport import fetch_passport_by_org, passport_to_client_context
from services.copilot_readiness import assess_copilot_readiness, readiness_label

org_id = "${ORG_ID}"

async def main():
    ready, reason = assess_copilot_readiness(org_id)
    print("==> readiness:", "ok" if ready else readiness_label(reason))
    if not ready:
        raise SystemExit(1)

    passport = fetch_passport_by_org(org_id)
    ctx = passport_to_client_context(passport)
    context_block = (
        f"[CLIENT CONTEXT]\\n"
        f"Brand Name: {ctx['brand_name']}\\n"
        f"Industry: {ctx['industry']}\\n"
        f"Target Location: {ctx['target_location']}\\n"
        f"Target Audience: {ctx['target_audience']}\\n"
        f"Core Offer: {ctx['core_offer']}\\n"
        f"User Role: Owner\\n"
        f"[END CLIENT CONTEXT]\\n\\n"
    )
    messages = [
        {
            "role": "user",
            "content": context_block + "Instagram uchun 3 ta reklama g'oyasi bering.",
        }
    ]

    from converza_agent.groq_client import groq_configured
    print("==> llm:", "groq" if groq_configured() else "hermes")
    print("==> streaming reply:")
    chunks = []
    async for token in stream_copilot(messages, system_prompt=COPILOT_SYSTEM_PROMPT, max_tokens=400):
        chunks.append(token)
        print(token, end="", flush=True)
    print()
    if not chunks:
        print("ERROR: empty response")
        raise SystemExit(1)
    print("==> ok, chars:", sum(len(c) for c in chunks))

asyncio.run(main())
PY

echo ""
echo "If ERROR above, check: docker compose -f $COMPOSE_FILE logs web --tail 40"
