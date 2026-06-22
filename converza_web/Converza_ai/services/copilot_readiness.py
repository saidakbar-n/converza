"""Co-Pilot activation checks (web panel)."""

from services.brand_passport import fetch_passport_by_org

READINESS_LABELS = {
    "no_passport": "Brend pasporti saqlanmagan",
    "incomplete_passport": "Pasport to'liq emas (biznes nomi va taklif kerak)",
}


def assess_copilot_readiness(org_id: str) -> tuple[bool, str]:
    """Co-Pilot requires a saved brand passport with core fields."""
    passport = fetch_passport_by_org(org_id)
    if not passport:
        return False, "no_passport"
    if not (passport.get("brand_name") or "").strip():
        return False, "incomplete_passport"
    if not (passport.get("core_offer") or "").strip():
        return False, "incomplete_passport"
    return True, ""


def readiness_label(reason: str) -> str:
    return READINESS_LABELS.get(reason, reason or "Noma'lum sabab")
