"""Brand passport enrichment — DB columns must not be overwritten by stale raw_notes meta."""

from services.brand_passport import _embed_meta_in_raw_notes, enrich_passport


def test_enrich_passport_prefers_db_tone_over_stale_meta():
    raw_notes = _embed_meta_in_raw_notes(
        "User notes",
        {
            "_passport": {
                "tone": "Samimiy, ishonchli va lo'nda",
                "brand_name": "From Meta",
            }
        },
    )
    row = {
        "id": "passport-1",
        "org_id": "788881532",
        "brand_name": "From DB",
        "tone": "Professional va to'g'ridan-to'g'ri",
        "raw_notes": raw_notes,
    }

    enriched = enrich_passport(row)

    assert enriched["tone"] == "Professional va to'g'ridan-to'g'ri"
    assert enriched["brand_name"] == "From DB"
