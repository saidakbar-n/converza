"""Lightweight inbound message language detection (uz / ru / en)."""

from __future__ import annotations

import re

# Strong English phrases / words (avoid matching single letters like "is", "in", "do").
_EN = re.compile(
    r"\b("
    r"hello|hi|hey|please|thanks|thank you|sorry|excuse me|"
    r"how much|how do|how can|what is|what are|what do|can you|could you|would you|"
    r"do you|tell me|i want|i need|i am|interested|buy|order|price|cost|"
    r"website|email|call me|help me|more info|information about"
    r")\b",
    re.I,
)

# Standard Uzbek words (word boundaries).
_UZ_WORDS = re.compile(
    r"\b("
    r"salom|assalom|narx|qancha|rahmat|kerak|xizmat|yordam|qayer|qachon|bormi|"
    r"mavjud|qanday|qaysi|iltimos|kechirasiz|sotib|buyurtma|narxi|haqida|"
    r"malumot|ma'lumot|koproq|ko'proq|bering|beringiz|bervor|sizlar|sizlarni|"
    r"sizni|uchun|bizning|biznes|taklif|obuna|qiziq|bilmoqchi|yozing"
    r")\b|o['']|g['']|gʻ|oʻ",
    re.I,
)

# Colloquial Latin Uzbek without apostrophes (substring match).
_UZ_LATIN_ROOTS = re.compile(
    r"haqida|xizmat|malumot|koproq|ko'proq|kopraq|bering|bervor|sizlar|sizlarni|"
    r"sizni|rahmat|qancha|narxi|narx|kerak|yordam|qanday|salom|assalom|"
    r"iltimos|biznes|taklif|obuna|som|so'm|ming|qayer|qaysi|bormi|mavjud|"
    r"uchun|bilmoqchi|yordam|xizmatla|xizmatlari|malumot|bering|beringiz",
    re.I,
)

# Uzbek Cyrillic (distinct letters or common words).
_UZ_CYRILLIC = re.compile(
    r"[қғўҳҚҒЎҲ]|"
    r"хизмат|маълумот|қанча|салом|рахмат|iltimos|haqida|yordam|kerak|"
    r"сизлар|сизга|беринг|мaълумot",
    re.I,
)

LANGUAGE_LABELS = {
    "uz": "o'zbek tilida",
    "ru": "rus tilida",
    "en": "English",
}

FALLBACK_REPLY = {
    "uz": "Kechirasiz, hozir javob bera olmayman. Birozdan so'ng qayta yozing.",
    "ru": "Извините, сейчас не могу ответить. Напишите чуть позже.",
    "en": "Sorry, I can't reply right now. Please try again in a moment.",
}


def detect_uzbek_script(text: str) -> str:
    """Return 'cyrillic' or 'latin' for Uzbek replies."""
    letters = [c for c in text if c.isalpha()]
    if not letters:
        return "latin"
    cyrillic = sum(1 for c in letters if "\u0400" <= c <= "\u04FF")
    if cyrillic / len(letters) >= 0.25:
        return "cyrillic"
    return "latin"


def language_instruction(lang: str, *, uz_script: str = "latin") -> str:
    if lang == "ru":
        return (
            "CRITICAL: Write `reply` and `condition_reason` ONLY in Russian (Cyrillic). "
            "Do not use Uzbek or English."
        )
    if lang == "en":
        return (
            "CRITICAL: Write `reply` and `condition_reason` ONLY in English. "
            "Do not use Uzbek or Russian."
        )
    if uz_script == "cyrillic":
        return (
            "CRITICAL: Write `reply` and `condition_reason` ONLY in Uzbek using Cyrillic script. "
            "Do not use Russian or English."
        )
    return (
        "CRITICAL: Write `reply` and `condition_reason` ONLY in Uzbek using Latin script. "
        "Do not use Russian or English."
    )


# Backward-compatible map (Latin Uzbek default).
LANGUAGE_INSTRUCTIONS = {
    "uz": language_instruction("uz", uz_script="latin"),
    "ru": language_instruction("ru"),
    "en": language_instruction("en"),
}


def _is_uzbek_latin(text: str) -> bool:
    return bool(_UZ_WORDS.search(text) or _UZ_LATIN_ROOTS.search(text))


def detect_reply_language(text: str) -> str:
    """
    Detect customer message language: uz, ru, or en.
    Defaults to uz for ambiguous Latin (Uzbekistan Telegram context).
    """
    if not (text or "").strip():
        return "uz"

    letters = [c for c in text if c.isalpha()]
    if not letters:
        return "uz"

    cyrillic_ratio = sum(1 for c in letters if "\u0400" <= c <= "\u04FF") / len(letters)

    if cyrillic_ratio >= 0.25:
        if _UZ_CYRILLIC.search(text):
            return "uz"
        return "ru"

    if _is_uzbek_latin(text):
        return "uz"

    if _EN.search(text):
        return "en"

    # Latin text without clear English cues → Uzbek (not English).
    return "uz"
