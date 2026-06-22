"""Lightweight inbound message language detection (uz / ru / en)."""

from __future__ import annotations

import re

_EN = re.compile(
    r"\b("
    r"hello|hi|hey|how|what|when|where|why|who|which|price|cost|please|thanks|thank|"
    r"you|can|could|would|do|does|did|is|are|was|were|the|this|that|much|about|"
    r"want|need|help|tell|know|interested|buy|order|service|product"
    r")\b",
    re.I,
)
_UZ = re.compile(
    r"\b("
    r"salom|assalom|narx|qancha|rahmat|kerak|xizmat|yordam|qayer|qachon|bormi|"
    r"mavjud|qanday|qaysi|iltimos|kechirasiz|sotib|buyurtma|narxi"
    r")\b|o['']|g['']|gʻ|oʻ",
    re.I,
)

LANGUAGE_LABELS = {
    "uz": "o'zbek tilida",
    "ru": "rus tilida (по-русски)",
    "en": "English",
}

LANGUAGE_INSTRUCTIONS = {
    "uz": (
        "CRITICAL: Write `reply` and `condition_reason` ONLY in Uzbek (Latin script). "
        "Do not use Russian or English."
    ),
    "ru": (
        "CRITICAL: Write `reply` and `condition_reason` ONLY in Russian (Cyrillic). "
        "Do not use Uzbek or English."
    ),
    "en": (
        "CRITICAL: Write `reply` and `condition_reason` ONLY in English. "
        "Do not use Uzbek or Russian."
    ),
}

FALLBACK_REPLY = {
    "uz": "Kechirasiz, hozir javob bera olmayman. Birozdan so'ng qayta yozing.",
    "ru": "Извините, сейчас не могу ответить. Напишите чуть позже.",
    "en": "Sorry, I can't reply right now. Please try again in a moment.",
}


def detect_reply_language(text: str) -> str:
    """
    Detect customer message language: uz, ru, or en.
    Defaults to uz when unclear.
    """
    if not (text or "").strip():
        return "uz"

    letters = [c for c in text if c.isalpha()]
    if not letters:
        return "uz"

    cyrillic = sum(1 for c in letters if "\u0400" <= c <= "\u04FF")
    if cyrillic / len(letters) >= 0.25:
        return "ru"

    if _UZ.search(text):
        return "uz"

    if _EN.search(text):
        return "en"

    ascii_words = re.findall(r"[a-zA-Z']+", text)
    if ascii_words and all(w.isascii() for w in ascii_words) and len(ascii_words) >= 2:
        return "en"

    return "uz"
