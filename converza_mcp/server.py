#!/usr/bin/env python3
"""
Converza MCP server — exposes brand, conversation, and Telegram tools to Hermes.

Run: python -u converza_mcp/server.py
"""

from __future__ import annotations

import asyncio
import json
import os
import sys

from mcp.server.fastmcp import FastMCP

from converza_mcp.brand_store import (
    get_conversation_history,
    get_daily_stats,
    get_org_context,
    log_outbound_message,
    update_prospect_condition,
)
from converza_mcp.telegram_actions import (
    select_invoice_item,
    send_invoice,
    send_message,
)

mcp = FastMCP("converza")


def _payments_enabled(org: dict) -> bool:
    token = (org.get("click_token") or "").strip()
    if len(token) < 20 or ":" not in token:
        return False
    return token.lower() not in {"", "test", "123456", "changeme"}


@mcp.tool()
def get_brand_context(org_id: str) -> str:
    """Load organization brand passport and connection metadata for an org_id."""
    ctx = get_org_context(org_id)
    safe = {
        "org_id": ctx["org_id"],
        "business_connection_id": ctx.get("business_connection_id"),
        "payments_enabled": _payments_enabled(ctx),
        "brand_context": ctx.get("brand_context") or {},
    }
    return json.dumps(safe, ensure_ascii=False)


@mcp.tool()
def get_message_history(org_id: str, prospect_id: str, limit: int = 20) -> str:
    """Return recent conversation messages for a prospect (oldest first)."""
    history = get_conversation_history(org_id, prospect_id, limit=min(limit, 50))
    return json.dumps(history, ensure_ascii=False)


@mcp.tool()
def set_prospect_condition(
    prospect_id: str,
    client_condition: str,
    condition_reason: str,
) -> str:
    """Update prospect pipeline stage: cold | warm | purchasing | closed."""
    result = update_prospect_condition(prospect_id, client_condition, condition_reason)
    return json.dumps(result)


@mcp.tool()
def record_outbound_message(
    org_id: str,
    prospect_id: str,
    conversation_id: str,
    content: str,
) -> str:
    """Log an AI outbound message to Supabase."""
    result = log_outbound_message(org_id, prospect_id, conversation_id, content)
    return json.dumps(result)


@mcp.tool()
async def telegram_send_text(
    chat_id: int,
    text: str,
    business_connection_id: str = "",
) -> str:
    """Send a Telegram text message (Business Connection aware)."""
    conn = business_connection_id.strip() or None
    result = await send_message(chat_id, text, conn)
    return json.dumps(result)


@mcp.tool()
async def telegram_send_click_invoice(
    org_id: str,
    chat_id: int,
    prospect_id: str,
    invoice_tier: str = "",
    business_connection_id: str = "",
) -> str:
    """Send a Click payment invoice via Telegram for the org's configured provider token."""
    org = get_org_context(org_id)
    token = (org.get("click_token") or "").strip()
    if not _payments_enabled(org):
        return json.dumps({"ok": False, "error": "payments_not_configured"})
    brand = org.get("brand_context") or {}
    item = select_invoice_item(brand, invoice_tier or None)
    conn = business_connection_id.strip() or org.get("business_connection_id")
    result = await send_invoice(chat_id, token, prospect_id, item, conn)
    return json.dumps(result)


@mcp.tool()
def get_org_stats(org_id: str) -> str:
    """Daily stats for audit reports."""
    return json.dumps(get_daily_stats(org_id), ensure_ascii=False)


def main() -> None:
    for key in ("SUPABASE_URL", "SUPABASE_SERVICE_KEY"):
        if not os.getenv(key):
            print(f"Missing required env: {key}", file=sys.stderr)
            sys.exit(1)
    mcp.run()


if __name__ == "__main__":
    main()
