"""Daily business report stats and Uzbek formatting for @ConverzaApp_bot."""

from __future__ import annotations

import logging
import re
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from db.supabase_client import sb
from services.brand_passport import fetch_passport_by_org

logger = logging.getLogger(__name__)

TZ = ZoneInfo("Asia/Tashkent")

CONDITION_LABELS = {
    "cold": "Sovuq (Cold)",
    "warm": "Iliq (Warm)",
    "purchasing": "Xarid jarayonida (Purchasing)",
    "closed": "Yopilgan (Closed)",
}

# Hermes/Groq failure strings must never appear as owner tips.
_INVALID_TIP_RE = re.compile(
    r"(413|payload too large|cannot compress|traceback|hermes returned|"
    r"request entity too large|context.?length|token.?limit|"
    r"rate.?limit|timed? ?out|exception|error:)",
    re.I,
)


def _now_local() -> datetime:
    return datetime.now(TZ)


def _day_start(dt: datetime | None = None) -> datetime:
    base = dt or _now_local()
    return base.replace(hour=0, minute=0, second=0, microsecond=0)


def _iso_utc(dt: datetime) -> str:
    return dt.astimezone(ZoneInfo("UTC")).isoformat()


def fetch_daily_report_data(org_id: str) -> dict:
    """Collect stats for today's report (Tashkent calendar day)."""
    today_start = _day_start()
    week_start = _day_start() - timedelta(days=today_start.weekday())
    today_iso = _iso_utc(today_start)
    week_iso = _iso_utc(week_start)

    passport = fetch_passport_by_org(org_id) or {}
    brand_name = (passport.get("brand_name") or "").strip() or "Kompaniya"

    msg_rows = (
        sb.table("messages")
        .select("direction, created_at")
        .eq("org_id", org_id)
        .gte("created_at", week_iso)
        .execute()
    ).data or []

    today_inbound = 0
    today_outbound = 0
    week_total = len(msg_rows)
    for row in msg_rows:
        created = row.get("created_at") or ""
        if created >= today_iso:
            if row.get("direction") == "inbound":
                today_inbound += 1
            elif row.get("direction") == "outbound":
                today_outbound += 1

    prospects = (
        sb.table("prospects")
        .select("client_condition")
        .eq("org_id", org_id)
        .execute()
    ).data or []

    conditions = {key: 0 for key in CONDITION_LABELS}
    for prospect in prospects:
        condition = (prospect.get("client_condition") or "cold").lower()
        if condition in conditions:
            conditions[condition] += 1

    return {
        "org_id": org_id,
        "brand_name": brand_name,
        "today_inbound": today_inbound,
        "today_outbound": today_outbound,
        "today_total": today_inbound + today_outbound,
        "week_total": week_total,
        "prospect_conditions": conditions,
        "prospect_total": sum(conditions.values()),
        "report_date": today_start.strftime("%d.%m.%Y"),
    }


def _activity_summary(stats: dict) -> str:
    total = stats["today_total"]
    week = stats["week_total"]
    if total == 0 and week == 0:
        return (
            f"Bugun kompaniya faoliyati doirasida yuborilgan va qabul qilingan xabarlar "
            f"soni 0 ta bo'lib, bu hafta davomida faol aloqalar yo'qligini ko'rsatmoqda."
        )
    if total == 0:
        return (
            f"Bugun yuborilgan va qabul qilingan xabarlar soni 0 ta. "
            f"Bu hafta jami {week} ta xabar qayd etilgan."
        )
    return (
        f"Bugun jami {total} ta xabar almashildi "
        f"({stats['today_inbound']} ta kiruvchi, {stats['today_outbound']} ta chiquvchi). "
        f"Bu hafta jami {week} ta xabar."
    )


def _pipeline_summary(stats: dict) -> str:
    conditions = stats["prospect_conditions"]
    total = stats["prospect_total"]
    lines = ["Mijozlar holatiga kelsak,"]

    if total == 0:
        lines.append(
            "bugun quyidagi holatlarning hech biriga ega mijozlar mavjud emas:"
        )
    else:
        lines.append("joriy pipeline bo'yicha:")

    for key, label in CONDITION_LABELS.items():
        lines.append(f"- {label} - {conditions[key]} ta mijoz")

    if total == 0:
        lines.append("")
        lines.append(
            "Umumiy hisobda, bugun mijozlar bilan aloqalar yo'qligi sababli, "
            "xarid jarayonlari yoki yopilgan mijozlar haqida ma'lumot mavjud emas."
        )
    elif conditions["purchasing"] == 0 and conditions["closed"] == 0:
        lines.append("")
        lines.append(
            "Hozircha xarid jarayonida yoki yopilgan holatdagi mijozlar qayd etilmagan."
        )
    return "\n".join(lines)


def format_daily_report(stats: dict) -> str:
    """Format the canonical Uzbek daily report (deterministic, brand-aware)."""
    header = "📊 KUNLIK HISOBOT"
    intro = (
        f"Bugungi statistik hisobot ({stats['report_date']}):\n\n"
        f"{_activity_summary(stats)}\n\n"
        f"{_pipeline_summary(stats)}"
    )
    brand = stats.get("brand_name")
    if brand and brand != "Kompaniya":
        intro = f"🏢 {brand}\n\n{intro}"
    return f"{header}\n\n{intro}"


def build_deterministic_tip(stats: dict) -> str:
    """Short owner tip from stats only — no LLM, no session, no MCP."""
    conditions = stats.get("prospect_conditions") or {}
    cold = int(conditions.get("cold") or 0)
    warm = int(conditions.get("warm") or 0)
    purchasing = int(conditions.get("purchasing") or 0)
    closed = int(conditions.get("closed") or 0)
    today = int(stats.get("today_total") or 0)
    week = int(stats.get("week_total") or 0)
    total = int(stats.get("prospect_total") or 0)

    if today == 0 and week == 0 and total == 0:
        return (
            "Telegram Business ulanishini tekshiring va yangi suhbatlarni ochish "
            "uchun bitta aniq offer postini joylang."
        )
    if today == 0 and week == 0:
        return (
            "Bu hafta faollik past. Iliq yoki sovuq mijozlarga qisqa follow-up "
            "yozishdan boshlang."
        )
    if purchasing > 0:
        return (
            f"{purchasing} ta mijoz xarid jarayonida. Bugun ularga to'lov tugmasi "
            "yoki aniq next step yuboring."
        )
    if warm > 0:
        return (
            f"{warm} ta iliq mijoz bor. Har biriga 1 ta aniq savol bilan follow-up "
            "qiling — isitishni saqlab qoling."
        )
    if closed > 0 and today == 0:
        return (
            f"{closed} ta yopilgan mijoz bor. Bugun yangi lead oqimini ochish uchun "
            "bitta post yoki story joylang."
        )
    if cold > 0 and today == 0:
        return (
            f"{cold} ta sovuq mijoz kutmoqda. Ularga yumshoq ochilish xabari "
            "yuborib suhbatni qayta boshlang."
        )
    if today > 0:
        return (
            f"Bugun {today} ta xabar almashildi. Iliq va xarid bosqichidagi "
            "mijozlarni birinchi navbatda yoping."
        )
    return (
        "Statistika past. Brand passport va Click to'lovni tekshirib, bitta "
        "aniq call-to-action bilan yangi suhbat oching."
    )


def is_valid_tip(tip: str) -> bool:
    text = (tip or "").strip()
    if not text or len(text) > 500:
        return False
    if _INVALID_TIP_RE.search(text):
        return False
    return True


def append_tip(base: str, tip: str) -> str:
    cleaned = (tip or "").strip()
    if not is_valid_tip(cleaned):
        return base
    return f"{base}\n\n💡 Tavsiya: {cleaned}"


async def _optional_llm_tip(stats: dict) -> str | None:
    """
    Tiny Groq completion only. Never Hermes sessions/MCP — those blow past
    context limits and surface 413 errors as tip text.
    """
    try:
        from converza_agent.groq_client import groq_complete_text, groq_configured

        if not groq_configured():
            return None

        compact = {
            "brand": stats.get("brand_name"),
            "date": stats.get("report_date"),
            "today_total": stats.get("today_total"),
            "week_total": stats.get("week_total"),
            "cold": (stats.get("prospect_conditions") or {}).get("cold", 0),
            "warm": (stats.get("prospect_conditions") or {}).get("warm", 0),
            "purchasing": (stats.get("prospect_conditions") or {}).get("purchasing", 0),
            "closed": (stats.get("prospect_conditions") or {}).get("closed", 0),
        }
        tip = await groq_complete_text(
            (
                "Siz Converza auditorisiz. Faqat 1-2 qisqa O'zbekcha tavsiya yozing. "
                "Raqamlarni o'zgartirmang. Xato/xabar kodlarini qaytarmang. "
                "Markdown yoki JSON yo'q."
            ),
            (
                "Quyidagi kundalik statistikaga asoslangan tavsiya yozing:\n"
                f"{compact}"
            ),
            max_tokens=120,
            temperature=0.3,
        )
        tip = (tip or "").strip()
        if tip.lower().startswith("tavsiya:"):
            tip = tip.split(":", 1)[1].strip()
        return tip if is_valid_tip(tip) else None
    except Exception as exc:
        logger.info("Daily report LLM tip skipped: %s", exc)
        return None


async def build_daily_report(org_id: str, *, use_hermes: bool = False) -> str:
    """
    Build daily report. Body is always deterministic.
    Tip: deterministic by default; optional Groq polish when use_hermes=True
    (name kept for callers — Hermes session path removed to avoid 413 payloads).
    """
    stats = fetch_daily_report_data(org_id)
    base = format_daily_report(stats)
    tip = build_deterministic_tip(stats)

    if use_hermes:
        polished = await _optional_llm_tip(stats)
        if polished:
            tip = polished

    return append_tip(base, tip)
