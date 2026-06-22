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
if curl -fsS -m 15 "$BASE/health" | grep -q '"status"'; then
  pass "/health"
else
  fail "/health unreachable"
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
echo "==> Landing UI (auth gate + pricing)"
LANDING=$(curl -fsS -m 15 "$BASE/" 2>/dev/null || echo "")
if echo "$LANDING" | grep -q 'data-sign-in'; then
  pass "Landing has Telegram Sign in"
else
  fail "Landing missing Sign in — on VPS: cd /opt/converza && git pull && sudo ./scripts/go-live.sh"
fi
if echo "$LANDING" | grep -q '\$500'; then
  fail "Landing still shows \$500 — redeploy web container on VPS"
else
  pass "Landing pricing removed"
fi
AUTH_JS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 15 "$BASE/js/landing-auth.js" 2>/dev/null || echo "000")
if [[ "$AUTH_JS_CODE" == "200" ]]; then
  pass "/js/landing-auth.js"
else
  fail "/js/landing-auth.js → $AUTH_JS_CODE (rebuild web on VPS)"
fi

APP=$(curl -fsS -m 15 "$BASE/app" 2>/dev/null || echo "")
if echo "$APP" | grep -q 'access-request-form'; then
  fail "/app still has duplicate access form — redeploy web on VPS"
else
  pass "/app duplicate access form removed"
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
