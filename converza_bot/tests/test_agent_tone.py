"""Tests for agent tone presets."""

from services.agent_tone import TONE_OPTIONS, tone_by_index, tone_index


def test_tone_index_roundtrip():
    for i, label in enumerate(TONE_OPTIONS):
        assert tone_index(label) == i
        assert tone_by_index(i) == label


def test_tone_index_unknown():
    assert tone_index("Unknown tone") is None
    assert tone_by_index(99) is None
