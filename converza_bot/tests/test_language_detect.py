"""Tests for inbound language detection."""

from converza_agent.language_detect import (
    detect_reply_language,
    detect_uzbek_script,
    language_instruction,
)


def test_uzbek_latin_standard():
    assert detect_reply_language("Salom, narx qancha?") == "uz"
    assert detect_reply_language("Xizmat haqida ma'lumot kerak") == "uz"


def test_uzbek_latin_colloquial():
    msg = "sizlarni xizmatila haqida koproq malumot bervorin"
    assert detect_reply_language(msg) == "uz"
    assert detect_uzbek_script(msg) == "latin"


def test_uzbek_cyrillic():
    assert detect_reply_language("Салом, хизматлар haqida маълумot") == "uz"
    assert detect_reply_language("Хизматларингiz haqida ko'proq ma'lumot") == "uz"
    assert detect_uzbek_script("Хизмат haqida") == "cyrillic"


def test_russian_cyrillic():
    assert detect_reply_language("Привет, сколько стоит?") == "ru"
    assert detect_reply_language("Здравствуйте, расскажите о услуге") == "ru"


def test_english():
    assert detect_reply_language("Hello, how much does it cost?") == "en"
    assert detect_reply_language("Hi, what is the price please?") == "en"
    assert detect_reply_language("How much is the basic plan?") == "en"


def test_ambiguous_latin_defaults_uzbek():
    assert detect_reply_language("asosiy reja bormi") == "uz"


def test_uzbek_cyrillic_instruction():
    assert "Cyrillic" in language_instruction("uz", uz_script="cyrillic")
    assert "Latin" in language_instruction("uz", uz_script="latin")
