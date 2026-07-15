"""Eval: closer tone adaptation stays compact and inbound-driven."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from converza_agent.tone_adapt import blend_tone, compact_brand_context, extract_client_style


CASES = [
    {
        "id": "formal-uz",
        "inbound": "Assalomu alaykum, paket narxlari haqida bilmoqchiman.",
        "history": [],
        "expect_formality": "formal",
        "expect_emoji": False,
    },
    {
        "id": "casual-emoji",
        "inbound": "ok 😊",
        "history": [{"role": "user", "content": "salom"}, {"role": "user", "content": "qancha?"}],
        "expect_formality": "casual",
        "expect_emoji": True,
    },
]


def main() -> int:
    failed = 0
    fat = {
        "brand_name": "Converza",
        "tone": "Samimiy, ishonchli va lo'nda",
        "core_offer": "AI sales agent",
        "raw_notes": "n" * 5000,
        "brand_passport": {"nested": True, "raw_notes": "huge"},
        "pricing": [{"tier": "Pilot", "price": "500000", "features": ["x"] * 50}],
    }
    slim = compact_brand_context(fat)
    size = len(json.dumps(slim, ensure_ascii=False))
    checks = [
        ("no nested passport", "brand_passport" not in slim),
        ("payload under 2500 chars", size < 2500),
    ]
    for name, ok in checks:
        print(f"[{'PASS' if ok else 'FAIL'}] compact: {name}")
        if not ok:
            failed += 1

    for case in CASES:
        style = extract_client_style(case["inbound"], case["history"])
        tip = blend_tone("Professional va to'g'ridan-to'g'ri", style)
        case_checks = [
            ("formality", style.formality == case["expect_formality"] or (
                case["expect_formality"] == "casual" and style.formality in ("casual", "neutral")
            )),
            ("emoji flag", style.uses_emoji is case["expect_emoji"]),
            ("blend has brand", "Brand tone:" in tip),
            ("blend has client", "Client style:" in tip),
        ]
        for name, ok in case_checks:
            print(f"[{'PASS' if ok else 'FAIL'}] {case['id']}: {name}")
            if not ok:
                failed += 1

    if failed:
        print(f"\n{failed} check(s) failed")
        return 1
    print("\nAll tone-adapt eval checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
