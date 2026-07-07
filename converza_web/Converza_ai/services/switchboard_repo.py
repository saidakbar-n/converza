from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from db import get_supabase
from services.brand_passport import fetch_passport_by_org


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class SwitchboardRepository:
    def __init__(self) -> None:
        self.client = get_supabase()

    def get_brand_passport(self, org_id: str) -> dict[str, Any]:
        return fetch_passport_by_org(org_id) or {"org_id": org_id}

    def get_agent_memory(
        self,
        org_id: str,
        agent_slug: str,
        *,
        limit: int = 12,
        pinned_only: bool = False,
    ) -> list[dict[str, Any]]:
        query = (
            self.client.table("agent_memory")
            .select("*")
            .eq("org_id", org_id)
            .eq("agent_slug", agent_slug)
        )
        if pinned_only:
            query = query.eq("pinned", True)
        result = query.order("created_at", desc=False).limit(limit).execute()
        return result.data or []

    def list_pinned_memory(self, org_id: str, *, limit: int = 80) -> list[dict[str, Any]]:
        result = (
            self.client.table("agent_memory")
            .select("*")
            .eq("org_id", org_id)
            .eq("pinned", True)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    def list_agent_thread(
        self,
        org_id: str,
        agent_slug: str,
        *,
        limit: int = 40,
    ) -> list[dict[str, Any]]:
        result = (
            self.client.table("agent_memory")
            .select("*")
            .eq("org_id", org_id)
            .eq("agent_slug", agent_slug)
            .eq("pinned", False)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return result.data or []

    def delete_agent_memory(self, org_id: str, memory_id: str) -> bool:
        result = (
            self.client.table("agent_memory")
            .delete()
            .eq("org_id", org_id)
            .eq("id", memory_id)
            .execute()
        )
        return bool(result.data)

    def wipe_agent_memory(self, org_id: str, *, pinned_only: bool = False) -> int:
        query = self.client.table("agent_memory").delete().eq("org_id", org_id)
        if pinned_only:
            query = query.eq("pinned", True)
        result = query.execute()
        return len(result.data or [])

    def create_pinned_memory(
        self,
        org_id: str,
        *,
        content: str,
        agent_slug: str = "milo",
        source: str = "owner",
    ) -> dict[str, Any]:
        result = (
            self.client.table("agent_memory")
            .insert(
                {
                    "org_id": org_id,
                    "agent_slug": agent_slug,
                    "role": "user",
                    "content": content.strip(),
                    "pinned": True,
                    "source": source,
                }
            )
            .execute()
        )
        return (result.data or [{}])[0]

    def get_org_model_settings(self, org_id: str) -> dict[str, str]:
        result = (
            self.client.table("org_model_settings")
            .select("settings")
            .eq("org_id", org_id)
            .maybe_single()
            .execute()
        )
        row = result.data if result else None
        settings = (row or {}).get("settings") or {}
        if not isinstance(settings, dict):
            return {}
        return {str(k): str(v) for k, v in settings.items()}

    def upsert_org_model_settings(self, org_id: str, settings: dict[str, str]) -> dict[str, str]:
        payload = {
            "org_id": org_id,
            "settings": settings,
            "updated_at": utc_now_iso(),
        }
        self.client.table("org_model_settings").upsert(payload).execute()
        return settings

    def list_pending_hitl(self, org_id: str, *, limit: int = 12) -> list[dict[str, Any]]:
        result = (
            self.client.table("drafts")
            .select("id, org_id, agent_slug, draft_content, context_summary, status, created_at")
            .eq("org_id", org_id)
            .eq("status", "pending")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    def agent_run_stats(self, org_id: str) -> dict[str, dict[str, int]]:
        result = (
            self.client.table("agent_runs")
            .select("agent_slug, status")
            .eq("org_id", org_id)
            .order("created_at", desc=True)
            .limit(200)
            .execute()
        )
        stats: dict[str, dict[str, int]] = {
            slug: {"runs": 0, "awaiting_hitl": 0, "failed": 0}
            for slug in ("milo", "sleyz", "vea")
        }
        for row in result.data or []:
            slug = str(row.get("agent_slug") or "")
            if slug not in stats:
                continue
            stats[slug]["runs"] += 1
            status = str(row.get("status") or "")
            if status == "awaiting_hitl":
                stats[slug]["awaiting_hitl"] += 1
            elif status == "failed":
                stats[slug]["failed"] += 1
        return stats

    def insert_agent_memory(
        self,
        org_id: str,
        agent_slug: str,
        role: str,
        content: str,
    ) -> dict[str, Any]:
        result = (
            self.client.table("agent_memory")
            .insert(
                {
                    "org_id": org_id,
                    "agent_slug": agent_slug,
                    "role": role,
                    "content": content,
                }
            )
            .execute()
        )
        return (result.data or [{}])[0]

    def create_agent_run(
        self,
        org_id: str,
        agent_slug: str,
        triggered_by: str,
        input_text: str,
    ) -> str:
        result = (
            self.client.table("agent_runs")
            .insert(
                {
                    "org_id": org_id,
                    "agent_slug": agent_slug,
                    "triggered_by": triggered_by,
                    "input_text": input_text,
                    "status": "running",
                }
            )
            .execute()
        )
        return str((result.data or [{}])[0]["id"])

    def update_agent_run(self, run_id: str, updates: dict[str, Any]) -> None:
        self.client.table("agent_runs").update(updates).eq("id", run_id).execute()

    def insert_agent_run_step(
        self,
        agent_run_id: str,
        org_id: str,
        agent_slug: str,
        step_label: str,
        step_status: str,
        detail: str | None = None,
    ) -> dict[str, Any]:
        result = (
            self.client.table("agent_run_steps")
            .insert(
                {
                    "agent_run_id": agent_run_id,
                    "org_id": org_id,
                    "agent_slug": agent_slug,
                    "step_label": step_label,
                    "step_status": step_status,
                    "detail": detail,
                }
            )
            .execute()
        )
        return (result.data or [{}])[0]

    def insert_squad_message(
        self,
        *,
        org_id: str,
        sender_slug: str,
        content: str,
        mentions: list[str] | None = None,
        related_run_id: str | None = None,
        hitl_draft_id: str | None = None,
    ) -> dict[str, Any]:
        result = (
            self.client.table("squad_messages")
            .insert(
                {
                    "org_id": org_id,
                    "sender_slug": sender_slug,
                    "content": content,
                    "mentions": mentions or [],
                    "related_run_id": related_run_id,
                    "hitl_draft_id": hitl_draft_id,
                }
            )
            .execute()
        )
        return (result.data or [{}])[0]

    def list_squad_messages(self, org_id: str, *, limit: int = 80) -> list[dict[str, Any]]:
        result = (
            self.client.table("squad_messages")
            .select("*")
            .eq("org_id", org_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return result.data or []

    def list_agent_run_steps(self, org_id: str, *, limit: int = 120) -> list[dict[str, Any]]:
        result = (
            self.client.table("agent_run_steps")
            .select("*")
            .eq("org_id", org_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return result.data or []

    def create_draft(
        self,
        *,
        org_id: str,
        agent_slug: str,
        inbound_text: str,
        draft_content: str,
        prospect_id: str | None = None,
    ) -> dict[str, Any]:
        result = (
            self.client.table("drafts")
            .insert(
                {
                    "org_id": org_id,
                    "agent_slug": agent_slug,
                    "prospect_id": prospect_id,
                    "conversation_id": str(uuid.uuid4()),
                    "draft_content": draft_content,
                    "context_summary": inbound_text[:500],
                    "status": "pending",
                    "updated_at": utc_now_iso(),
                }
            )
            .execute()
        )
        return (result.data or [{}])[0]

    def update_draft(self, draft_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        payload = {"updated_at": utc_now_iso(), **updates}
        result = self.client.table("drafts").update(payload).eq("id", draft_id).execute()
        return (result.data or [{}])[0]

    def get_draft(self, draft_id: str) -> dict[str, Any] | None:
        result = (
            self.client.table("drafts")
            .select("*")
            .eq("id", draft_id)
            .maybe_single()
            .execute()
        )
        return result.data if result else None
