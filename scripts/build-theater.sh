#!/usr/bin/env bash
# Compile Theater UI (React source in web/) → static files for FastAPI.
# Next.js is build tooling only — production runs Python/uvicorn, no Node process.
#
#   ./scripts/build-theater.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$ROOT/converza_web/Converza_ai/web"
OUT="$ROOT/converza_web/Converza_ai/static/theater"

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm not found. Install Node 20+ or build in CI." >&2
  exit 1
fi

echo "==> npm ci + build (static export)"
cd "$WEB"
npm ci
npm run build

echo "==> Copy web/out → static/theater/"
rm -rf "$OUT"
cp -r out "$OUT"
test -f "$OUT/index.html"

echo "==> Theater static export OK ($(du -sh "$OUT" | cut -f1))"
echo "    Commit static/theater/ with web/ changes, then redeploy web container."
