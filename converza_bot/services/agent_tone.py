"""DM Closer tone presets — shared with web passport form."""

from __future__ import annotations

from datetime import datetime, timezone

from db.supabase_client import sb
from services.brand_passport import fetch_passport_by_org

TONE_OPTIONS: tuple[str, ...] = (
    "Samimiy, ishonchli va lo'nda",
    "Professional va to'g'ridan-to'g'ri",
    "Iliq va maslahatchi",
)

TONE_CALLBACK_PREFIX = "tone:"


def tone_by_index(index: int) -> str | None:
    if 0 <= index < len(TONE_OPTIONS):
        return TONE_OPTIONS[index]
    return None


def tone_index(tone: str | None) -> int | None:
    if not tone:
        return None
    normalized = tone.strip()
    for i, option in enumerate(TONE_OPTIONS):
        if option == normalized:
            return i
    return None


def set_passport_tone(org_id: str, tone: str) -> dict | None:
    """Update tone on existing brand passport. Returns updated row or None if missing."""
    if tone not in TONE_OPTIONS:
        raise ValueError("invalid_tone")

    existing = fetch_passport_by_org(org_id)
    if not existing or not existing.get("id"):
        return None

    now = datetime.now(timezone.utc).isoformat()
    sb.table("brand_passports").update({"tone": tone, "updated_at": now}).eq(
        "id", existing["id"]
    ).execute()
    return fetch_passport_by_org(org_id)
