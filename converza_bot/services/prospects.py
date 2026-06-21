"""Prospect read/write for DM Closer."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from db.supabase_client import sb
from services.brand_passport import sync_organization
from services.supabase_errors import format_supabase_error

logger = logging.getLogger(__name__)


def _telegram_user_id(external_id: str) -> int | str:
    """Map external_id to tg_user_id (legacy live DB column)."""
    try:
        return int(external_id)
    except (TypeError, ValueError):
        return external_id


def _find_existing_prospect(
    org_id: str,
    platform: str,
    external_id: str,
) -> dict | None:
    row = _maybe_single(
        sb.table("prospects")
        .select("id, conversation_id")
        .eq("org_id", org_id)
        .eq("platform", platform)
        .eq("external_id", external_id)
    )
    if row:
        return row

    tg_uid = _telegram_user_id(external_id)
    try:
        return _maybe_single(
            sb.table("prospects")
            .select("id, conversation_id")
            .eq("org_id", org_id)
            .eq("tg_user_id", tg_uid)
        )
    except Exception as exc:
        logger.debug("prospect lookup by tg_user_id skipped: %s", exc)
        return None


def _build_prospect_payload(
    org_id: str,
    platform: str,
    external_id: str,
    meta: dict,
) -> dict:
    payload = {
        "org_id": org_id,
        "platform": platform,
        "external_id": external_id,
        "metadata": meta,
        # Legacy live schema (NOT NULL tg_user_id on older Supabase projects).
        "tg_user_id": _telegram_user_id(external_id),
    }
    return payload


def _maybe_single(query) -> dict | None:
    result = query.maybe_single().execute()
    if result is None:
        return None
    return result.data


def ensure_organization(org_id: str) -> None:
    """FK target for prospects — must exist before insert."""
    sync_organization(org_id)
    try:
        sb.table("organizations").upsert({"id": org_id}).execute()
    except Exception as exc:
        logger.warning("ensure_organization upsert for %s: %s", org_id, exc)


def get_or_create_prospect(
    org_id: str,
    external_id: str,
    metadata: dict | None = None,
    *,
    platform: str = "telegram",
) -> tuple[str, str | None]:
    """
    Return (prospect_id, conversation_id).

    Uses select-then-insert (not PostgREST upsert) so missing unique indexes
    on older databases do not break inbound DMs.
    """
    ensure_organization(org_id)
    meta = {k: v for k, v in (metadata or {}).items() if v is not None}

    existing = _find_existing_prospect(org_id, platform, external_id)
    if existing:
        prospect_id = str(existing["id"])
        conversation_id = existing.get("conversation_id")
        if meta:
            try:
                sb.table("prospects").update(
                    {
                        "metadata": meta,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }
                ).eq("id", prospect_id).execute()
            except Exception as exc:
                logger.debug("prospect metadata update skipped: %s", exc)
        return prospect_id, conversation_id

    payload = _build_prospect_payload(org_id, platform, external_id, meta)
    try:
        inserted = sb.table("prospects").insert(payload).execute()
    except Exception as exc:
        err = format_supabase_error(exc)
        if "duplicate" in err.lower() or "23505" in err:
            row = _find_existing_prospect(org_id, platform, external_id)
            if row:
                return str(row["id"]), row.get("conversation_id")
        logger.error(
            "prospect insert failed org_id=%s external_id=%s: %s",
            org_id,
            external_id,
            err,
        )
        raise RuntimeError(err) from exc

    if not inserted.data:
        raise RuntimeError("prospect insert returned no rows")

    row = inserted.data[0]
    return str(row["id"]), row.get("conversation_id")


def ensure_conversation_id(prospect_id: str, conversation_id: str | None) -> str:
    if conversation_id:
        return conversation_id
    conversation_id = str(uuid.uuid4())
    sb.table("prospects").update({"conversation_id": conversation_id}).eq(
        "id", prospect_id
    ).execute()
    return conversation_id
