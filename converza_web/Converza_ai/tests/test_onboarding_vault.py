"""Tests for Brand Vault → Hermes passport mapping."""

from services.onboarding_vault import map_answers_to_passport


def test_map_answers_sets_hermes_core_fields():
    mapped = map_answers_to_passport(
        {
            "business_name": "Nafis Salon",
            "industry": "Beauty",
            "core_offer": "Facial kits",
            "ideal_customer": "Women 25-40",
            "customer_location": "Tashkent",
            "brand_tone": ["Warm", "Direct"],
            "brand_colors": ["#112233"],
            "primary_pain_point": "Slow replies",
            "primary_goal": "faster replies",
            "owner_contact": "Nur, +998",
            "channels_requested": ["Telegram", "Instagram"],
        }
    )
    assert mapped["brand_name"] == "Nafis Salon"
    assert mapped["target_audience"] == "Women 25-40"
    assert mapped["target_location"] == "Tashkent"
    assert mapped["tone"] == "Warm, Direct"
    assert mapped["hex_colors"] == ["#112233"]
    assert "Pain: Slow replies" in mapped["raw_notes"]
    assert "Telegram" in mapped["raw_notes"]
