"""Gate tests for client tone adaptation."""

from converza_agent.tone_adapt import (
    blend_tone,
    compact_brand_context,
    extract_client_style,
)


def test_formal_inbound_style():
    style = extract_client_style("Assalomu alaykum, narx haqida ma'lumot bersangiz.")
    assert style.formality == "formal"
    assert not style.uses_emoji


def test_casual_short_acks():
    history = [
        {"role": "user", "content": "salom"},
        {"role": "assistant", "content": "Salom!"},
        {"role": "user", "content": "ok"},
    ]
    style = extract_client_style("ok 👍", history)
    assert style.formality in ("casual", "neutral")
    assert style.uses_emoji is True
    assert style.uses_short_acks is True


def test_blend_tone_mentions_client_style():
    style = extract_client_style("hey bro how much?")
    blended = blend_tone("Professional va to'g'ridan-to'g'ri", style)
    assert "Brand tone:" in blended
    assert "Client style:" in blended
    assert "emoji" in blended.lower()


def test_compact_brand_drops_nested_passport():
    fat = {
        "brand_name": "Nafis",
        "tone": "Iliq va maslahatchi",
        "core_offer": "Facial",
        "raw_notes": "x" * 2000,
        "pricing": [{"tier": "Basic", "price": "100", "features": ["a"] * 20}],
        "faq": [{"question": "Q?", "answer": "A" * 500}],
        "brand_passport": {"id": "secret", "org_id": "1", "raw_notes": "huge"},
        "competitors": [{"name": "Rival"}],
    }
    slim = compact_brand_context(fat)
    assert "brand_passport" not in slim
    assert "competitors" not in slim
    assert slim["brand_name"] == "Nafis"
    assert len(slim["raw_notes"]) <= 801
    assert slim["pricing"][0]["tier"] == "Basic"
    assert "features" not in slim["pricing"][0]
