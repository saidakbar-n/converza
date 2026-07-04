#!/usr/bin/env bash
# Verify getconverza.com (or any base URL) matches the two-bot + Hermes ship checklist.
# Usage: scripts/verify-production.sh [https://getconverza.com]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="${1:-https://getconverza.com}"
BASE="${BASE%/}"

FAIL=0
pass() { echo "  OK  $*"; }
fail() { echo "  FAIL $*"; FAIL=1; }
warn() { echo "  WARN $*"; }

echo "==> Converza production verify: $BASE"
echo ""

echo "==> Health"
HEALTH=$(curl -fsS -m 15 "$BASE/health" 2>/dev/null || echo '{}')
if echo "$HEALTH" | grep -q '"status"'; then
  pass "/health"
else
  fail "/health unreachable"
fi
if echo "$HEALTH" | grep -q '"theater_ui":true'; then
  pass "/health theater_ui=true (Next.js baked into container)"
elif echo "$HEALTH" | grep -q '"theater_ui":false'; then
  fail "/health theater_ui=false — on VPS: sudo ./scripts/redeploy-web.sh"
fi

echo ""
echo "==> Ready probe"
READY=$(curl -fsS -m 15 "$BASE/ready" 2>/dev/null || echo '{}')
echo "$READY" | head -c 1200
echo ""
if echo "$READY" | grep -q '"status":"ready"'; then
  pass "/ready"
else
  warn "/ready not_ready — check HERMES_API_KEY, TELEGRAM_APP_BOT_TOKEN, Hermes sidecar"
fi

echo ""
echo "==> Two-bot auth config"
AUTH=$(curl -fsS -m 15 "$BASE/api/auth/config" 2>/dev/null || echo '{}')
echo "$AUTH"
if echo "$AUTH" | grep -q 'ConverzaApp_bot'; then
  pass "Login widget bot = ConverzaApp_bot"
else
  fail "Expected bot_username ConverzaApp_bot — deploy latest web code"
fi
if echo "$AUTH" | grep -q 'sales_bot_username'; then
  pass "sales_bot_username present"
else
  fail "Missing sales_bot_username in /api/auth/config"
fi

echo ""
echo "==> Webhook routes (expect 200 or 403, not 502)"
for path in webhook/telegram webhook/app; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 15 -X POST "$BASE/$path" \
    -H "Content-Type: application/json" \
    -d '{"update_id":999999999}' || echo "000")
  if [[ "$CODE" == "502" || "$CODE" == "000" ]]; then
    fail "POST /$path → $CODE (bot unreachable?)"
  elif [[ "$path" == "webhook/app" && "$CODE" == "405" ]]; then
    fail "POST /$path → 405 — deploy latest web code (missing /webhook/app route)"
  else
    pass "POST /$path → $CODE"
  fi
done

echo ""
echo "==> Landing UI (contributor Next.js page)"
LANDING_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 15 -L "$BASE/" 2>/dev/null || echo "000")
LANDING_BODY=$(curl -fsSL -m 15 "$BASE/app/landing" 2>/dev/null || echo "")
if echo "$LANDING_BODY" | grep -q 'data-sign-in'; then
  pass "Landing has Sign in (data-sign-in) at /app/landing"
elif echo "$LANDING_BODY" | grep -q 'Fire your \$5,000 marketing agency'; then
  pass "Landing serves contributor marketing copy"
else
  fail "Landing missing contributor page — rebuild theater and redeploy web"
fi
if [[ "$LANDING_CODE" == "200" || "$LANDING_CODE" == "307" ]]; then
  pass "/ redirects to marketing landing ($LANDING_CODE)"
else
  fail "/ → $LANDING_CODE (expected redirect or 200)"
fi

APP=$(curl -fsSL -m 15 "$BASE/app" 2>/dev/null || echo "")
if echo "$APP" | grep -q 'Converza — Co-Pilot'; then
  pass "/app serves Theater UI (Next.js static export)"
elif echo "$APP" | grep -q 'Converza Dashboard'; then
  fail "/app still serves legacy app.html — on VPS: cd /opt/converza && sudo ./scripts/vps-sync.sh && sudo ./scripts/go-live.sh"
elif echo "$APP" | grep -q 'access-request-form'; then
  fail "/app still has duplicate access form — redeploy web on VPS"
else
  fail "/app missing Theater UI — rebuild web container on VPS (go-live.sh)"
fi

echo ""
echo "==> Smoke tests"
if "$ROOT/scripts/smoke-test.sh" "$BASE"; then
  pass "smoke-test.sh"
else
  fail "smoke-test.sh"
fi

echo ""
if [[ -f "$ROOT/converza_bot/.env" ]] || [[ -f /etc/converza/.env ]]; then
  echo "==> Telegram webhook registration (getWebhookInfo)"
  "$ROOT/scripts/verify-webhooks.sh" || warn "verify-webhooks failed (tokens missing locally?)"
else
  warn "Skip webhook info — no .env found locally"
fi

echo ""
if [[ "$FAIL" -eq 0 ]]; then
  echo "==> Production verify PASSED (manual PILOT.md steps still required)"
  exit 0
fi
echo "==> Production verify FAILED — fix items above, then redeploy"
exit 1
