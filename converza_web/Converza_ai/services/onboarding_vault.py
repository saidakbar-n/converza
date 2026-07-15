"""Brand Vault onboarding save — Hermes-ready brand_passports writes for production web."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

from db import get_supabase
from services.brand_passport import upsert_passport
from services.supabase_errors import parse_missing_column

logger = logging.getLogger(__name__)


def _number_or_none(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _int_or_none(value: Any) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _missing_column(error: Exception) -> str | None:
    return parse_missing_column(error)


def map_answers_to_passport(answers: dict[str, Any]) -> dict[str, Any]:
    tones = answers.get("brand_tone") or []
    colors = answers.get("brand_colors") or []
    channels = answers.get("channels_requested") or []
    tone_text = ", ".join(tones) if isinstance(tones, list) else (tones or "")
    notes = []
    if answers.get("primary_pain_point"):
        notes.append(f"Pain: {answers['primary_pain_point']}")
    if answers.get("primary_goal"):
        notes.append(f"Goal: {answers['primary_goal']}")
    if answers.get("owner_contact"):
        notes.append(f"Owner contact: {answers['owner_contact']}")
    if isinstance(channels, list) and channels:
        notes.append(f"Channels: {', '.join(str(c) for c in channels)}")
    return {
        "brand_name": answers.get("business_name") or "Untitled brand",
        "industry": answers.get("industry"),
        "core_offer": answers.get("core_offer"),
        "target_audience": answers.get("ideal_customer"),
        "target_location": answers.get("customer_location"),
        "tone": tone_text or None,
        "hex_colors": colors if isinstance(colors, list) else [],
        "raw_notes": "\n".join(notes),
        "onboarding_answers": answers,
        "current_marketing_handler": answers.get("current_marketing_handler"),
        "current_marketing_spend": _number_or_none(answers.get("current_marketing_spend")),
        "current_reply_handler": answers.get("current_reply_handler"),
        "weekly_message_volume": _int_or_none(answers.get("weekly_message_volume")),
        "primary_pain_point": answers.get("primary_pain_point"),
        "primary_goal": answers.get("primary_goal"),
        "channels_requested": channels if isinstance(channels, list) else [],
        "owner_name": answers.get("owner_name"),
        "owner_contact": answers.get("owner_contact"),
        "paywall_status": "pending",
    }


def sync_organization(org_id: str) -> None:
    try:
        get_supabase().table("organizations").upsert({"id": org_id}).execute()
    except Exception as exc:
        logger.warning("sync_organization skipped for %s: %s", org_id, exc)


def get_passport_by_owner(owner_user_id: str) -> dict[str, Any] | None:
    try:
        result = (
            get_supabase()
            .table("brand_passports")
            .select("*")
            .eq("owner_user_id", owner_user_id)
            .order("updated_at", desc=True)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None
    except Exception as exc:
        if "owner_user_id" in str(exc) or "42703" in str(exc):
            return None
        raise


def get_passport_by_org(org_id: str) -> dict[str, Any] | None:
    result = (
        get_supabase()
        .table("brand_passports")
        .select("*")
        .eq("org_id", org_id)
        .order("updated_at", desc=True)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def save_vault_passport(
    *,
    owner_user_id: str,
    org_id: str,
    answers: dict[str, Any],
) -> dict[str, Any]:
    """
    Persist Brand Vault answers so Hermes/DM closer can read core passport fields.

    Strategy:
    1) Ensure organizations row exists (FK)
    2) Write extended columns when present
    3) Always persist Hermes core fields via upsert_passport fallback
    """
    sync_organization(org_id)
    mapped = map_answers_to_passport(answers)
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "owner_user_id": owner_user_id,
        "org_id": org_id,
        **mapped,
        "updated_at": now,
    }

    existing = get_passport_by_owner(owner_user_id) or get_passport_by_org(org_id)
    sb = get_supabase()

    def write(next_payload: dict[str, Any]):
        if existing:
            if "paywall_status" in next_payload:
                next_payload["paywall_status"] = existing.get("paywall_status") or "pending"
            return sb.table("brand_passports").update(next_payload).eq("id", existing["id"]).execute()
        return sb.table("brand_passports").insert(next_payload).execute()

    working = dict(payload)
    for _ in range(24):
        try:
            result = write(working)
            row = result.data[0]
            # Mirror core fields through upsert so closer enrichment path stays consistent.
            upsert_passport(
                org_id,
                {
                    "brand_name": mapped.get("brand_name"),
                    "industry": mapped.get("industry"),
                    "core_offer": mapped.get("core_offer"),
                    "target_audience": mapped.get("target_audience"),
                    "target_location": mapped.get("target_location"),
                    "tone": mapped.get("tone"),
                    "hex_colors": mapped.get("hex_colors") or [],
                    "raw_notes": mapped.get("raw_notes") or "",
                },
            )
            return get_passport_by_org(org_id) or row
        except Exception as exc:
            missing = _missing_column(exc)
            if missing and missing in working:
                working.pop(missing)
                continue
            if "23503" in str(exc) or "organizations" in str(exc).lower():
                sync_organization(org_id)
                continue
            # Schema too old for Brand Vault columns — Hermes core only.
            logger.warning("Vault extended save failed, using core upsert: %s", exc)
            saved = upsert_passport(
                org_id,
                {
                    "brand_name": mapped.get("brand_name"),
                    "industry": mapped.get("industry"),
                    "core_offer": mapped.get("core_offer"),
                    "target_audience": mapped.get("target_audience"),
                    "target_location": mapped.get("target_location"),
                    "tone": mapped.get("tone"),
                    "hex_colors": mapped.get("hex_colors") or [],
                    "raw_notes": (
                        f"---converza_onboarding---\n"
                        f"{json.dumps({'owner_user_id': owner_user_id, 'onboarding_answers': answers}, ensure_ascii=False)}\n"
                        f"---end_onboarding---\n"
                        f"{mapped.get('raw_notes') or ''}"
                    ).strip(),
                },
            )
            return saved

    raise RuntimeError("Failed to save Brand Vault passport")


def mark_vault_complete(owner_user_id: str, org_id: str | None = None) -> dict[str, Any]:
    existing = get_passport_by_owner(owner_user_id)
    if not existing and org_id:
        existing = get_passport_by_org(org_id)
    if not existing:
        raise KeyError(owner_user_id)

    updates: dict[str, Any] = {
        "onboarding_completed_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    working = dict(updates)
    sb = get_supabase()
    for _ in range(6):
        try:
            result = (
                sb.table("brand_passports")
                .update(working)
                .eq("id", existing["id"])
                .execute()
            )
            return result.data[0]
        except Exception as exc:
            missing = _missing_column(exc)
            if missing and missing in working:
                working.pop(missing)
                continue
            notes = (existing.get("raw_notes") or "") + "\n[onboarding_completed]"
            result = (
                sb.table("brand_passports")
                .update(
                    {
                        "raw_notes": notes.strip(),
                        "updated_at": updates["updated_at"],
                    }
                )
                .eq("id", existing["id"])
                .execute()
            )
            return result.data[0]
    raise RuntimeError("Failed to mark onboarding complete")
