"""Brand passport reads/writes for MCP tools (mirrors bot brand_passport logic)."""

import json
import re
from datetime import datetime, timezone

from converza_mcp.supabase_client import get_sb

_META_START = "---converza_meta---"
_META_END = "---end_meta---"

DB_FIELDS = (
    "brand_name",
    "industry",
    "target_location",
    "target_audience",
    "core_offer",
    "tone",
    "pricing",
    "faq",
    "objections",
    "raw_notes",
)


def _extract_meta(raw_notes: str) -> tuple[dict, str]:
    text = raw_notes or ""
    match = re.search(
        rf"{re.escape(_META_START)}\s*(\{{.*?\}})\s*{re.escape(_META_END)}",
        text,
        flags=re.DOTALL,
    )
    if not match:
        return {}, text
    try:
        meta = json.loads(match.group(1))
    except json.JSONDecodeError:
        meta = {}
    clean = re.sub(
        rf"{re.escape(_META_START)}.*?{re.escape(_META_END)}\s*",
        "",
        text,
        flags=re.DOTALL,
    ).strip()
    return meta, clean


def normalize_brand_context(passport: dict | None) -> dict:
    if not passport:
        return {}
    raw_notes = passport.get("raw_notes") or ""
    meta, clean_notes = _extract_meta(raw_notes)
    embedded = meta.get("_passport") or {}
    ctx = {**passport, **embedded}
    ctx["raw_notes"] = clean_notes
    return ctx


def get_org_context(org_id: str) -> dict:
    sb = get_sb()
    org_row = (
        sb.table("organizations").select("*").eq("id", org_id).maybe_single().execute()
    )
    org = (org_row.data if org_row else None) or {}
    passport_row = (
        sb.table("brand_passports").select("*").eq("org_id", org_id).maybe_single().execute()
    )
    passport = (passport_row.data if passport_row else None) or {}
    return {
        "org_id": org_id,
        "click_token": org.get("click_token") or "",
        "business_connection_id": org.get("business_connection_id"),
        "brand_context": normalize_brand_context(passport),
        "brand_passport_id": passport.get("id"),
    }


def get_conversation_history(org_id: str, prospect_id: str, limit: int = 20) -> list[dict]:
    sb = get_sb()
    result = (
        sb.table("messages")
        .select("direction, content, created_at")
        .eq("org_id", org_id)
        .eq("prospect_id", prospect_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    rows = list(reversed(result.data or []))
    return [
        {
            "role": "user" if row["direction"] == "inbound" else "assistant",
            "content": row["content"],
        }
        for row in rows
    ]


def update_prospect_condition(prospect_id: str, client_condition: str, condition_reason: str) -> dict:
    sb = get_sb()
    sb.table("prospects").update(
        {"client_condition": client_condition, "condition_reason": condition_reason}
    ).eq("id", prospect_id).execute()
    return {"ok": True, "prospect_id": prospect_id}


def log_outbound_message(
    org_id: str,
    prospect_id: str,
    conversation_id: str,
    content: str,
    agent_model: str = "hermes-agent",
) -> dict:
    sb = get_sb()
    sb.table("messages").insert(
        {
            "org_id": org_id,
            "prospect_id": prospect_id,
            "direction": "outbound",
            "content": content,
            "sent_by": "ai",
            "agent_model": agent_model,
            "conversation_id": conversation_id,
        }
    ).execute()
    return {"ok": True}


def get_daily_stats(org_id: str) -> dict:
    """Stats for Hermes auditor MCP tool (mirrors bot daily_report)."""
    from datetime import datetime, timedelta
    from zoneinfo import ZoneInfo

    tz = ZoneInfo("Asia/Tashkent")
    today_start = datetime.now(tz).replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    today_iso = today_start.astimezone(ZoneInfo("UTC")).isoformat()
    week_iso = week_start.astimezone(ZoneInfo("UTC")).isoformat()

    sb = get_sb()
    msg_rows = (
        sb.table("messages")
        .select("direction, created_at")
        .eq("org_id", org_id)
        .gte("created_at", week_iso)
        .execute()
    ).data or []

    today_inbound = today_outbound = 0
    for row in msg_rows:
        if (row.get("created_at") or "") >= today_iso:
            if row.get("direction") == "inbound":
                today_inbound += 1
            elif row.get("direction") == "outbound":
                today_outbound += 1

    prospects = (
        sb.table("prospects").select("client_condition").eq("org_id", org_id).execute()
    ).data or []
    conditions = {"cold": 0, "warm": 0, "purchasing": 0, "closed": 0}
    for p in prospects:
        c = (p.get("client_condition") or "cold").lower()
        if c in conditions:
            conditions[c] += 1

    passport_row = (
        sb.table("brand_passports").select("brand_name").eq("org_id", org_id).maybe_single().execute()
    )
    brand_name = ""
    if passport_row and passport_row.data:
        brand_name = passport_row.data.get("brand_name") or ""

    return {
        "brand_name": brand_name,
        "today_inbound": today_inbound,
        "today_outbound": today_outbound,
        "today_total": today_inbound + today_outbound,
        "week_total": len(msg_rows),
        "prospect_conditions": conditions,
        "prospect_total": sum(conditions.values()),
    }
