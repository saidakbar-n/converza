#!/usr/bin/env bash
# Reset both Converza bot command menus (wipes Hermes /new, /model, etc.).
#
#   ./scripts/fix-bot-commands.sh          # sales + app bots
#   ./scripts/fix-bot-commands.sh sales    # @ConverzaSales_bot only
#   ./scripts/fix-bot-commands.sh app      # @ConverzaApp_bot only

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-all}"

run_sales() {
  chmod +x "$ROOT/scripts/fix-sales-bot-commands.sh"
  "$ROOT/scripts/fix-sales-bot-commands.sh"
}

run_app() {
  chmod +x "$ROOT/scripts/fix-app-bot-commands.sh"
  "$ROOT/scripts/fix-app-bot-commands.sh"
}

case "$TARGET" in
  all)
    run_sales
    echo ""
    run_app
    ;;
  sales)
    run_sales
    ;;
  app)
    run_app
    ;;
  *)
    echo "Usage: $0 [all|sales|app]" >&2
    exit 1
    ;;
esac
