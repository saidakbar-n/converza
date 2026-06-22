"""Tests for web API i18n."""

from services.i18n import copilot_reason_label, lang_from_request, normalize_lang, t


class _Req:
    def __init__(self, headers: dict):
        self.headers = headers


def test_normalize_lang():
    assert normalize_lang("ru-RU") == "ru"
    assert normalize_lang("en") == "en"
    assert normalize_lang(None) == "uz"


def test_t_uz_ru_en():
    assert "ismingiz" in t("uz", "access.full_name_required").lower() or "To'liq" in t("uz", "access.full_name_required")
    assert "имя" in t("ru", "access.full_name_required").lower()
    assert "name" in t("en", "access.full_name_required").lower()


def test_lang_from_request_header():
    req = _Req({"x-converza-lang": "ru"})
    assert lang_from_request(req) == "ru"


def test_copilot_reason_label():
    assert copilot_reason_label("en", "no_passport") == t("en", "copilot.no_passport")
