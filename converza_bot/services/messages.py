"""DM Closer message writes — supports legacy Supabase `messages.role` column."""

from __future__ import annotations

from db.supabase_client import sb


def build_message_row(
    *,
    org_id: str,
    prospect_id: str | None,
    direction: str,
    content: str,
    sent_by: str = "ai",
    agent_model: str | None = None,
    conversation_id: str | None = None,
) -> dict:
    row = {
        "org_id": org_id,
        "prospect_id": prospect_id,
        "direction": direction,
        "content": content,
        "sent_by": sent_by,
        "agent_model": agent_model,
        "conversation_id": conversation_id,
        # Legacy live DB: NOT NULL role (user | assistant | system).
        "role": "user" if direction == "inbound" else "assistant",
    }
    return {k: v for k, v in row.items() if v is not None}


def insert_message(
    *,
    org_id: str,
    prospect_id: str | None,
    direction: str,
    content: str,
    sent_by: str = "ai",
    agent_model: str | None = None,
    conversation_id: str | None = None,
) -> None:
    sb.table("messages").insert(
        build_message_row(
            org_id=org_id,
            prospect_id=prospect_id,
            direction=direction,
            content=content,
            sent_by=sent_by,
            agent_model=agent_model,
            conversation_id=conversation_id,
        )
    ).execute()
