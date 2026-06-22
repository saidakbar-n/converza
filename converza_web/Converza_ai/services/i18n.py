"""Web API i18n — uz / ru / en."""

from __future__ import annotations

from typing import Protocol

SUPPORTED = frozenset({"uz", "ru", "en"})
DEFAULT_LANG = "uz"

MESSAGES: dict[str, dict[str, str]] = {
    "access.full_name_required": {
        "uz": "To'liq ismingizni kiriting.",
        "ru": "Введите полное имя.",
        "en": "Enter your full name.",
    },
    "access.business_required": {
        "uz": "Biznes nomini kiriting.",
        "ru": "Введите название бизнеса.",
        "en": "Enter your business name.",
    },
    "access.message_short": {
        "uz": "Qiynayotgan muammoingizni kamida 30 belgi bilan yozing.",
        "ru": "Опишите проблему не менее чем в 30 символов.",
        "en": "Describe your challenge in at least 30 characters.",
    },
    "access.phone_invalid": {
        "uz": "To'g'ri telefon raqamini kiriting (masalan: +998901234567).",
        "ru": "Введите корректный номер телефона (например: +998901234567).",
        "en": "Enter a valid phone number (e.g. +998901234567).",
    },
    "access.telegram_required": {
        "uz": "Telegram @username majburiy — login shu orqali bog'lanadi.",
        "ru": "Telegram @username обязателен — вход через него.",
        "en": "Telegram @username is required — login is linked to it.",
    },
    "access.not_found": {
        "uz": "So'rov topilmadi.",
        "ru": "Заявка не найдена.",
        "en": "Request not found.",
    },
    "auth.telegram_invalid": {
        "uz": "Telegram autentifikatsiya kaliti noto'g'ri.",
        "ru": "Неверные данные Telegram-авторизации.",
        "en": "Invalid Telegram authentication.",
    },
    "auth.approval_required": {
        "uz": "Kirish uchun admin tasdig'i kerak. Avval kirish so'rovini yuboring va tasdiqlanishini kuting.",
        "ru": "Нужно одобрение администратора. Отправьте заявку и дождитесь подтверждения.",
        "en": "Admin approval required. Submit an access request and wait for approval.",
    },
    "passport.org_required": {
        "uz": "org_id talab qilinadi. Avval Telegram orqali kiring.",
        "ru": "Требуется org_id. Сначала войдите через Telegram.",
        "en": "org_id required. Sign in with Telegram first.",
    },
    "pdf.none": {
        "uz": "Kamida bitta PDF fayl yuklang.",
        "ru": "Загрузите хотя бы один PDF.",
        "en": "Upload at least one PDF file.",
    },
    "pdf.not_pdf": {
        "uz": "Faqat PDF fayllar qabul qilinadi: {filename}",
        "ru": "Принимаются только PDF: {filename}",
        "en": "Only PDF files allowed: {filename}",
    },
    "pdf.empty": {
        "uz": "Yuklangan fayllar bo'sh.",
        "ru": "Загруженные файлы пусты.",
        "en": "Uploaded files are empty.",
    },
    "passport.not_found": {
        "uz": "Brend pasporti topilmadi.",
        "ru": "Brand passport не найден.",
        "en": "Brand passport not found.",
    },
    "passport.forbidden": {
        "uz": "Bu pasport sizning hisobingizga tegishli emas.",
        "ru": "Этот passport не принадлежит вашему аккаунту.",
        "en": "This passport does not belong to your account.",
    },
    "copilot.not_ready": {
        "uz": "Co-Pilot hali tayyor emas: {reason}",
        "ru": "Co-Pilot ещё не готов: {reason}",
        "en": "Co-Pilot is not ready yet: {reason}",
    },
    "copilot.llm_missing": {
        "uz": "LLM sozlanmagan. GROQ_API_KEY yoki HERMES_API_KEY kerak.",
        "ru": "LLM не настроен. Нужен GROQ_API_KEY или HERMES_API_KEY.",
        "en": "LLM not configured. GROQ_API_KEY or HERMES_API_KEY required.",
    },
    "copilot.no_passport": {
        "uz": "Brend pasporti saqlanmagan",
        "ru": "Brand passport не сохранён",
        "en": "Brand passport not saved",
    },
    "copilot.incomplete_passport": {
        "uz": "Pasport to'liq emas (biznes nomi va taklif kerak)",
        "ru": "Passport неполный (нужны название и оффер)",
        "en": "Passport incomplete (business name and offer required)",
    },
    "copilot.unknown_reason": {
        "uz": "Noma'lum sabab",
        "ru": "Неизвестная причина",
        "en": "Unknown reason",
    },
}


def normalize_lang(value: str | None) -> str:
    if not value:
        return DEFAULT_LANG
    raw = value.strip().lower().replace("_", "-")
    if raw.startswith("uz"):
        return "uz"
    if raw.startswith("ru"):
        return "ru"
    if raw.startswith("en"):
        return "en"
    return DEFAULT_LANG


class LangRequest(Protocol):
    headers: dict


def lang_from_request(request: LangRequest) -> str:
    header = request.headers.get("x-converza-lang") or request.headers.get("accept-language")
    if not header:
        return DEFAULT_LANG
    first = header.split(",")[0].split(";")[0].strip()
    return normalize_lang(first)


def t(lang: str, key: str, **kwargs: str) -> str:
    lang = normalize_lang(lang)
    bucket = MESSAGES.get(key, {})
    text = bucket.get(lang) or bucket.get(DEFAULT_LANG) or key
    if kwargs:
        try:
            return text.format(**kwargs)
        except KeyError:
            return text
    return text


def copilot_reason_label(lang: str, reason: str) -> str:
    key = {
        "no_passport": "copilot.no_passport",
        "incomplete_passport": "copilot.incomplete_passport",
    }.get(reason, "copilot.unknown_reason")
    return t(lang, key)
