"""Eval: daily report tip must never surface Hermes/HTTP payload errors."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.daily_report import (
    append_tip,
    build_deterministic_tip,
    format_daily_report,
    is_valid_tip,
)

CASES = [
    {
        "id": "zero-activity",
        "stats": {
            "brand_name": "Converza AI",
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
            "report_date": "14.07.2026",
        },
        "poison": "Request payload too large (413). Cannot compress further.",
    },
    {
        "id": "warm-pipeline",
        "stats": {
            "brand_name": "Nafis",
            "today_inbound": 1,
            "today_outbound": 2,
            "today_total": 3,
            "week_total": 12,
            "prospect_conditions": {
                "cold": 4,
                "warm": 3,
                "purchasing": 0,
                "closed": 1,
            },
            "prospect_total": 8,
            "report_date": "14.07.2026",
        },
        "poison": "Cannot compress further.",
    },
]


def main() -> int:
    failed = 0
    for case in CASES:
        stats = case["stats"]
        base = format_daily_report(stats)
        tip = build_deterministic_tip(stats)
        report = append_tip(base, tip)
        poisoned = append_tip(base, case["poison"])

        checks = [
            ("has header", "📊 KUNLIK HISOBOT" in report),
            ("has tip", "💡 Tavsiya:" in report),
            ("tip valid", is_valid_tip(tip)),
            ("no 413 in report", "413" not in report),
            ("no compress error", "compress" not in report.lower()),
            ("poison skipped", poisoned == base),
            ("poison not valid", not is_valid_tip(case["poison"])),
        ]
        for name, ok in checks:
            status = "PASS" if ok else "FAIL"
            print(f"[{status}] {case['id']}: {name}")
            if not ok:
                failed += 1

    if failed:
        print(f"\n{failed} check(s) failed")
        return 1
    print("\nAll daily-report tip eval checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
