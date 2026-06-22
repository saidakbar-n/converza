"""Tests for inbound language detection."""

from converza_agent.language_detect import detect_reply_language


def test_uzbek_latin():
    assert detect_reply_language("Salom, narx qancha?") == "uz"
    assert detect_reply_language("Xizmat haqida ma'lumot kerak") == "uz"


def test_russian_cyrillic():
    assert detect_reply_language("Привет, сколько стоит?") == "ru"
    assert detect_reply_language("Здравствуйте, расскажите о услуге") == "ru"


def test_english():
    assert detect_reply_language("Hello, how much does it cost?") == "en"
    assert detect_reply_language("Hi, what is the price please?") == "en"


def test_english_without_uz_markers():
    assert detect_reply_language("How much is the basic plan?") == "en"
