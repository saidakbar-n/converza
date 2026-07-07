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
    ) -> list[dict[str, Any]]:
        result = (
            self.client.table("agent_memory")
            .select("*")
            .eq("org_id", org_id)
            .eq("agent_slug", agent_slug)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return result.data or []

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
