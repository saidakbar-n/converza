"""Daily report formatting tests."""

from services.daily_report import (
    append_tip,
    build_deterministic_tip,
    format_daily_report,
    is_valid_tip,
)


def _empty_stats(**overrides):
    stats = {
        "brand_name": "Nafis Salon",
        "today_inbound": 0,
        "today_outbound": 0,
        "today_total": 0,
        "week_total": 0,
        "prospect_conditions": {
            "cold": 0,
            "warm": 0,
            "purchasing": 0,
            "closed": 0,
        },
        "prospect_total": 0,
        "report_date": "09.06.2026",
    }
    stats.update(overrides)
    return stats


def test_empty_report_matches_uzbek_template():
    text = format_daily_report(_empty_stats())
    assert "📊 KUNLIK HISOBOT" in text
    assert "Nafis Salon" in text
    assert "0 ta bo'lib" in text
    assert "Sovuq (Cold) - 0 ta mijoz" in text
    assert "faol aloqalar yo'qligini" in text


def test_deterministic_tip_for_zero_activity():
    tip = build_deterministic_tip(_empty_stats())
    assert "Telegram Business" in tip or "offer" in tip.lower()
    assert "413" not in tip


def test_deterministic_tip_prioritizes_purchasing():
    tip = build_deterministic_tip(
        _empty_stats(
            today_total=2,
            week_total=5,
            prospect_total=4,
            prospect_conditions={
                "cold": 1,
                "warm": 1,
                "purchasing": 2,
                "closed": 0,
            },
        )
    )
    assert "xarid" in tip.lower()
    assert "2" in tip


def test_rejects_413_payload_error_as_tip():
    assert not is_valid_tip("Request payload too large (413). Cannot compress further.")
    assert not is_valid_tip("Hermes returned 413: payload too large")


def test_append_tip_skips_invalid_error_payload():
    base = format_daily_report(_empty_stats())
    out = append_tip(base, "Request payload too large (413). Cannot compress further.")
    assert out == base
    assert "Tavsiya" not in out
    assert "413" not in out


def test_append_tip_keeps_valid_tip():
    base = format_daily_report(_empty_stats())
    out = append_tip(base, "Iliq mijozlarga follow-up yuboring.")
    assert "💡 Tavsiya: Iliq mijozlarga follow-up yuboring." in out
