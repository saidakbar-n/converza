#!/usr/bin/env bash
# Automated pre-flight checks before manual PILOT.md validation.
# Usage: scripts/pilot-check.sh [https://yourdomain.com]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="${1:-http://localhost:8001}"
BASE="${BASE%/}"

echo "==> Smoke tests"
"$ROOT/scripts/smoke-test.sh" "$BASE"

echo "==> Bot unit tests (org_resolver, closer_readiness)"
cd "$ROOT/converza_bot"
PYTHONPATH=. python3 -m pytest tests/ -q

echo "==> Bot import check (webhooks + onboarding must load)"
PYTHONPATH=. python3 -c "
from services.org_resolver import owner_org_id
from services.closer_readiness import assess_closer_readiness
from routers.webhooks import telegram_webhook
assert owner_org_id(42) == '42'
print('Bot imports OK')
"

echo "==> Manual PILOT.md steps still required:"
echo "    - Access request + admin approval"
echo "    - Brand passport save + Telegram Business connect"
echo "    - Customer DM to business account → DM Closer reply"
echo "==> Pilot pre-checks passed"
