#!/usr/bin/env python3
"""
Migrate legacy organizations.brand_context values into brand_passports.

Usage:
    cd converza_bot && source venv/bin/activate
    python ../scripts/migrate_brand_context.py          # dry run
    python ../scripts/migrate_brand_context.py --apply  # write changes

Converts:
  - string brand_context  -> structured passport (Groq) or raw_notes fallback
  - dict brand_context    -> brand_passports row with mapped fields
Clears brand_context on organizations after successful migration.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

BOT_ROOT = Path(__file__).resolve().parents[1] / "converza_bot"
sys.path.insert(0, str(BOT_ROOT))

from db.supabase_client import sb  # noqa: E402
from services.brand_passport import (  # noqa: E402
    DB_PASSPORT_FIELDS,
    fetch_passport_by_org,
    upsert_passport,
    sync_organization,
)
def _map_dict_context(data: dict) -> dict:
    """Map a legacy dict brand_context into brand_passports columns."""
    mapped = {k: data[k] for k in DB_PASSPORT_FIELDS if k in data and data[k] is not None}

    nested = data.get("brand_passport")
    if isinstance(nested, dict):
        for k in DB_PASSPORT_FIELDS:
            if k not in mapped and nested.get(k) is not None:
                mapped[k] = nested[k]

    if not mapped.get("brand_name"):
        mapped["brand_name"] = data.get("brand_name") or "Migrated Brand"
    if not mapped.get("target_audience"):
        mapped["target_audience"] = data.get("target_audience") or "Not specified"
    if not mapped.get("core_offer"):
        mapped["core_offer"] = data.get("core_offer") or "Not specified"

    mapped.setdefault("pricing", data.get("pricing") or [])
    mapped.setdefault("faq", data.get("faq") or [])
    mapped.setdefault("objections", data.get("objections") or [])
    mapped.setdefault("raw_notes", data.get("raw_notes") or "")
    return mapped


async def _text_to_passport(text: str) -> dict:
    text = text.strip()
    if len(text) < 40:
        return {
            "brand_name": "Migrated Brand",
            "target_audience": "Not specified",
            "core_offer": "Not specified",
            "raw_notes": text,
        }
    try:
        from agents.parser import summarize_to_structured_passport  # noqa: E402

        parsed = await summarize_to_structured_passport(text)
        if not parsed.get("brand_name"):
            parsed["brand_name"] = "Migrated Brand"
        if not parsed.get("target_audience"):
            parsed["target_audience"] = "Not specified"
        if not parsed.get("core_offer"):
            parsed["core_offer"] = "Not specified"
        return parsed
    except Exception as exc:
        print(f"  Groq parse failed ({exc}); storing as raw_notes")
        return {
            "brand_name": "Migrated Brand",
            "target_audience": "Not specified",
            "core_offer": "Not specified",
            "raw_notes": text,
        }


async def migrate(apply: bool) -> None:
    result = sb.table("organizations").select("id, brand_context").execute()
    rows = result.data or []

    migrated = 0
    skipped = 0

    for org in rows:
        org_id = org["id"]
        brand_context = org.get("brand_context")

        if brand_context is None or brand_context == "" or brand_context == {}:
            skipped += 1
            continue

        if fetch_passport_by_org(org_id):
            print(f"[skip] {org_id}: brand_passports row already exists")
            skipped += 1
            continue

        if isinstance(brand_context, str):
            passport_data = await _text_to_passport(brand_context)
        elif isinstance(brand_context, dict):
            passport_data = _map_dict_context(brand_context)
        else:
            print(f"[skip] {org_id}: unsupported brand_context type {type(brand_context)}")
            skipped += 1
            continue

        print(
            f"[plan] {org_id}: migrate -> brand_name={passport_data.get('brand_name')!r}"
        )

        if apply:
            sync_organization(org_id)
            upsert_passport(org_id, passport_data)
            sb.table("organizations").update({"brand_context": None}).eq(
                "id", org_id
            ).execute()
            print(f"[done] {org_id}: migrated and cleared brand_context")

        migrated += 1

    mode = "APPLIED" if apply else "DRY RUN"
    print(f"\n{mode}: {migrated} to migrate, {skipped} skipped")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write migrations to Supabase (default is dry run)",
    )
    args = parser.parse_args()
    asyncio.run(migrate(apply=args.apply))


if __name__ == "__main__":
    main()
