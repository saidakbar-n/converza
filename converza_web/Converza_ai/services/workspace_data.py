"""Workspace data for Theater of Work — prospects, competitors, media queue."""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import Any

from db import get_supabase
from services.brand_passport import fetch_passport_by_org

STAGE_BY_CONDITION: dict[str, str] = {
    "cold": "Warming Up",
    "warm": "Hesitating",
    "purchasing": "Ready to Pay",
    "closed": "Ready to Pay",
}


def _prospect_display_name(prospect: dict) -> str:
    meta = prospect.get("metadata") or {}
    if isinstance(meta, str):
        try:
            meta = json.loads(meta)
        except json.JSONDecodeError:
            meta = {}
    for key in ("first_name", "username", "name"):
        val = (meta.get(key) or "").strip()
        if val:
            return val
    ext = str(prospect.get("external_id") or "")
    return f"Lead {ext[-4:]}" if len(ext) >= 4 else "Lead"


def _latest_message(prospect_id: str) -> str:
    sb = get_supabase()
    try:
        result = (
            sb.table("messages")
            .select("content, direction, created_at")
            .eq("prospect_id", prospect_id)
            .order("created_at", desc=True)
            .limit(1)
            .maybe_single()
            .execute()
        )
        row = result.data if result else None
        if row and row.get("content"):
            return str(row["content"]).strip()
    except Exception:
        pass
    return ""


def fetch_pipeline(org_id: str) -> dict[str, Any]:
    sb = get_supabase()
    result = (
        sb.table("prospects")
        .select("id, external_id, client_condition, condition_reason, metadata, updated_at")
        .eq("org_id", org_id)
        .order("updated_at", desc=True)
        .limit(80)
        .execute()
    )
    leads = []
    for row in result.data or []:
        condition = (row.get("client_condition") or "cold").lower()
        leads.append(
            {
                "id": row["id"],
                "name": _prospect_display_name(row),
                "stage": STAGE_BY_CONDITION.get(condition, "Warming Up"),
                "condition": condition,
                "last_message": _latest_message(row["id"]) or (row.get("condition_reason") or ""),
                "channel": "Telegram",
                "updated_at": row.get("updated_at"),
            }
        )
    return {
        "columns": ["Warming Up", "Hesitating", "Ready to Pay"],
        "leads": leads,
    }


def _normalize_competitor(entry: Any, *, index: int) -> dict[str, str]:
    if isinstance(entry, str):
        return {
            "name": entry,
            "signal": "On Milo's watchlist",
            "cadence": "—",
            "severity": "med",
        }
    if isinstance(entry, dict):
        return {
            "name": str(entry.get("name") or entry.get("brand") or f"Rival {index + 1}"),
            "signal": str(entry.get("signal") or entry.get("note") or "Monitoring"),
            "cadence": str(entry.get("cadence") or entry.get("updated") or "—"),
            "severity": str(entry.get("severity") or "med"),
        }
    return {
        "name": f"Rival {index + 1}",
        "signal": "Monitoring",
        "cadence": "—",
        "severity": "low",
    }


def fetch_competitors(org_id: str) -> dict[str, Any]:
    passport = fetch_passport_by_org(org_id) or {}
    raw = passport.get("competitors") or []
    rivals = [_normalize_competitor(item, index=i) for i, item in enumerate(raw)]
    return {"rivals": rivals, "industry": passport.get("industry") or ""}


def fetch_dashboard(org_id: str) -> dict[str, Any]:
    sb = get_supabase()
    since = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()

    prospects = (
        sb.table("prospects")
        .select("client_condition")
        .eq("org_id", org_id)
        .execute()
    ).data or []

    active_leads = sum(
        1
        for p in prospects
        if (p.get("client_condition") or "cold").lower() not in ("closed",)
    )

    rendered = 0
    try:
        runs = (
            sb.table("dag_runs")
            .select("id")
            .eq("user_id", org_id)
            .execute()
        ).data or []
        run_ids = [r["id"] for r in runs if r.get("id")]
        if run_ids:
            nodes = (
                sb.table("dag_node_runs")
                .select("status")
                .in_("run_id", run_ids)
                .eq("agent_type", "ContentCreator_Agent")
                .eq("status", "completed")
                .execute()
            ).data or []
            rendered = len(nodes)
    except Exception:
        rendered = 0

    ledger = []
    try:
        msgs = (
            sb.table("messages")
            .select("content, sent_by, created_at, prospect_id")
            .eq("org_id", org_id)
            .order("created_at", desc=True)
            .limit(12)
            .execute()
        ).data or []
        for m in msgs:
            ts = m.get("created_at") or ""
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                time_label = dt.strftime("%I:%M %p").lstrip("0")
            except Exception:
                time_label = "—"
            agent = "Sleyz" if m.get("sent_by") == "ai" else "System"
            ledger.append(
                {
                    "id": m.get("prospect_id") or ts,
                    "time": time_label,
                    "agent": agent,
                    "action": (m.get("content") or "")[:120],
                }
            )
    except Exception:
        pass

    return {
        "metrics": {
            "revenue_mtd": "—",
            "active_leads": str(active_leads),
            "rendered_videos": str(rendered),
        },
        "ledger": ledger,
    }


def _node_title(node: dict) -> str:
    payload = node.get("output_payload") or node.get("input_payload") or {}
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError:
            payload = {}
    brief = payload.get("brief") or payload.get("title") or payload.get("concept")
    if brief:
        return str(brief)[:80]
    return f"Asset · {node.get('node_id') or 'render'}"


def fetch_media_queue(org_id: str) -> dict[str, Any]:
    sb = get_supabase()
    runs = (
        sb.table("dag_runs")
        .select("id")
        .eq("user_id", org_id)
        .order("started_at", desc=True)
        .limit(30)
        .execute()
    ).data or []
    run_ids = [r["id"] for r in runs if r.get("id")]
    if not run_ids:
        return {"queue": [], "completed": []}

    nodes = (
        sb.table("dag_node_runs")
        .select("*")
        .in_("run_id", run_ids)
        .eq("agent_type", "ContentCreator_Agent")
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    ).data or []

    queue = []
    completed = []
    for node in nodes:
        status = (node.get("status") or "pending").lower()
        title = _node_title(node)
        out = node.get("output_payload") or {}
        if not isinstance(out, dict):
            out = {}
        posted = bool(out.get("approved"))
        item = {
            "id": node["id"],
            "title": title,
            "status": status,
            "posted": posted,
        }
        if status in ("completed", "done"):
            completed.append(item)
        else:
            item["eta"] = "queued" if status == "pending" else "rendering"
            queue.append(item)
    return {"queue": queue, "completed": completed}


def approve_media_job(org_id: str, job_id: str) -> dict[str, Any]:
    sb = get_supabase()
    result = (
        sb.table("dag_node_runs")
        .select("*")
        .eq("id", job_id)
        .maybe_single()
        .execute()
    )
    row = result.data if result else None
    if not row:
        return {"ok": False, "error": "Job not found"}

    run_id = row.get("run_id")
    if run_id:
        run_res = (
            sb.table("dag_runs")
            .select("user_id")
            .eq("id", run_id)
            .maybe_single()
            .execute()
        )
        run = run_res.data if run_res else None
        if run and str(run.get("user_id")) != str(org_id):
            return {"ok": False, "error": "Forbidden"}

    output = row.get("output_payload") or {}
    if not isinstance(output, dict):
        output = {}
    output["approved"] = True
    output["approved_at"] = datetime.now(timezone.utc).isoformat()
    sb.table("dag_node_runs").update({"output_payload": output}).eq("id", job_id).execute()
    return {"ok": True, "id": job_id}


def fetch_milo_insights(org_id: str) -> dict[str, Any]:
    passport = fetch_passport_by_org(org_id) or {}
    location = passport.get("target_location") or "Uzbekistan"
    industry = passport.get("industry") or "your market"
    demand = [
        {
            "market": location,
            "trend": f"{industry} — monitoring search & social signals",
            "confidence": "high",
        }
    ]
    hooks = []
    core = (passport.get("core_offer") or "").strip()
    if core:
        hooks.append(
            {
                "variant": "A",
                "text": core[:120],
                "ctr": "—",
                "winner": True,
            }
        )
    return {"demand_signals": demand, "hooks": hooks}


def build_routing_context(org_id: str, agent: str) -> str:
    """Inject live workspace snapshot for @mention routing in Master Feed."""
    if agent == "milo":
        data = {**fetch_competitors(org_id), **fetch_milo_insights(org_id)}
    elif agent == "sleyz":
        data = fetch_pipeline(org_id)
    elif agent == "vea":
        data = fetch_media_queue(org_id)
    else:
        return ""
    return (
        f"\n[WORKSPACE SNAPSHOT — {agent.upper()}]\n"
        f"{json.dumps(data, ensure_ascii=False)[:4000]}\n"
        f"[END WORKSPACE SNAPSHOT]\n\n"
    )
