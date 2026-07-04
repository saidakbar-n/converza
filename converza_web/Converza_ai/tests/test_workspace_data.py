"""Tests for workspace_data helpers."""

from services.workspace_data import STAGE_BY_CONDITION, _normalize_competitor


def test_stage_mapping():
    assert STAGE_BY_CONDITION["cold"] == "Warming Up"
    assert STAGE_BY_CONDITION["warm"] == "Hesitating"
    assert STAGE_BY_CONDITION["purchasing"] == "Ready to Pay"


def test_normalize_competitor_string():
    row = _normalize_competitor("Nike SS26", index=0)
    assert row["name"] == "Nike SS26"
    assert row["severity"] == "med"
