#!/usr/bin/env bash
# Post-deploy smoke tests for Converza v1.
# Usage: scripts/smoke-test.sh [https://yourdomain.com]

set -euo pipefail

BASE="${1:-http://localhost:8001}"
BASE="${BASE%/}"

echo "==> Health: $BASE/health"
curl -fsS "$BASE/health" | grep -q '"status"'

echo "==> Ready: $BASE/ready"
READY=$(curl -fsS "$BASE/ready" || true)
echo "$READY"
if echo "$READY" | grep -q '"not_ready"'; then
  echo "WARN: web /ready reports not_ready (may be OK in dev without all keys)"
fi

echo "==> Auth config: $BASE/api/auth/config"
curl -fsS "$BASE/api/auth/config" | grep -q 'bot_username'

echo "==> Protected route returns 401 without token"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/dm-closer/onboard" \
  -H "Content-Type: application/json" \
  -d '{"org_id":"1","brand_name":"x","target_audience":"y","core_offer":"z"}')
if [[ "$STATUS" != "401" && "$STATUS" != "403" ]]; then
  echo "ERROR: expected 401/403 on unauthenticated onboard, got $STATUS" >&2
  exit 1
fi

BOT_URL="${BOT_INTERNAL_URL:-http://localhost:8000}"
echo "==> Bot health: $BOT_URL/health"
if curl -fsS "$BOT_URL/health" 2>/dev/null | grep -q '"status"'; then
  echo "Bot OK"
else
  echo "WARN: bot not reachable at $BOT_URL (skip if web-only test)"
fi

echo "==> Access request endpoint accepts POST"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/access-request" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test","business_name":"Test Biz","message":"Bu test xabari yetarlicha uzun bolishi kerak demo.","contact":"+998901234567","telegram_username":"@testuser"}')
if [[ "$STATUS" != "200" && "$STATUS" != "400" && "$STATUS" != "422" ]]; then
  echo "ERROR: unexpected status on access-request POST: $STATUS" >&2
  exit 1
fi

echo "==> Webhook proxy returns error when bot unreachable (dev expectation)"
if [[ "$BASE" == http://localhost* ]]; then
  PROXY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/webhook/telegram" \
    -H "Content-Type: application/json" \
    -d '{"update_id":999999001,"message":{"message_id":1,"date":1,"chat":{"id":1,"type":"private"},"from":{"id":1,"is_bot":false,"first_name":"T"},"text":"hi"}}' || true)
  if [[ "$PROXY_STATUS" == "502" ]]; then
    echo "Webhook proxy correctly surfaces bot_unreachable (502)"
  else
    echo "WARN: webhook proxy status $PROXY_STATUS (502 expected if bot down)"
  fi
fi

echo "==> Smoke tests passed"
