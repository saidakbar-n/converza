"""
Searcher — retrieves context from Supabase to ground the Closer's reply.

Pulls:
- The org's Brand Passport (offer, pricing, FAQ)
- The prospect's conversation history (last N messages)
- The prospect record
"""

from services.brand_passport import get_org_context


async def get_organization(org_id: str) -> dict:
    """Return org context with normalized brand passport for agent consumption."""
    return get_org_context(org_id)


async def get_brand_context(org_id: str) -> dict:
    """Return the brand passport for the given org."""
    org = await get_organization(org_id)
    return org.get("brand_context", {})


async def get_conversation_history(
    org_id: str,
    prospect_id: str,
    limit: int = 20,
) -> list[dict]:
    """
    Return the last `limit` messages for this prospect, oldest first,
    formatted as {role, content} pairs for LLM context.
    """
    import uuid as _uuid

    from db.supabase_client import sb

    try:
        _uuid.UUID(str(prospect_id))
    except (TypeError, ValueError):
        return []

    try:
        result = (
            sb.table("messages")
            .select("direction, role, content, sent_by, created_at")
            .eq("org_id", org_id)
            .eq("prospect_id", prospect_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
    except Exception:
        return []

    rows = list(reversed(result.data or []))

    history = []
    for row in rows:
        direction = row.get("direction")
        if direction == "inbound":
            role = "user"
        elif direction == "outbound":
            role = "assistant"
        else:
            role = row.get("role") or "user"
        content = row.get("content") or ""
        if content:
            history.append({"role": role, "content": content})

    return history


async def get_prospect(prospect_id: str) -> dict:
    """Return full prospect record."""
    from db.supabase_client import sb

    result = (
        sb.table("prospects")
        .select("*")
        .eq("id", prospect_id)
        .maybe_single()
        .execute()
    )
    return (result.data if result else None) or {}
