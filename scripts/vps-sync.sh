#!/usr/bin/env bash
# Reset VPS checkout to match origin/main when submodule leftovers block git pull.
# Preserves /etc/converza/.env (not in repo).
#
#   cd /opt/converza && sudo ./scripts/vps-sync.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Fetching origin"
git fetch origin

echo "==> Hard reset to origin/main (discards local git changes in /opt/converza)"
git reset --hard origin/main

echo "==> Remove untracked files (old submodule checkouts)"
git clean -fd

echo "==> Verify Dockerfiles (monorepo layout)"
if ! grep -q 'converza_bot/requirements.txt' converza_bot/Dockerfile 2>/dev/null; then
  echo "ERROR: converza_bot/Dockerfile still wrong after sync" >&2
  head -15 converza_bot/Dockerfile >&2
  exit 1
fi
if ! grep -q 'converza_web/Converza_ai/requirements.txt' converza_web/Converza_ai/Dockerfile 2>/dev/null; then
  echo "ERROR: web Dockerfile still wrong after sync" >&2
  head -15 converza_web/Converza_ai/Dockerfile >&2
  exit 1
fi

echo "==> Sync OK at $(git log -1 --oneline)"
echo "    Next: sudo ./scripts/go-live.sh"
