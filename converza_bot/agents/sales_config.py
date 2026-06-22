"""Sales bot /config — owner chooses DM Closer tone via inline keyboard."""

from __future__ import annotations

import logging

import httpx

from services.agent_tone import (
    TONE_CALLBACK_PREFIX,
    TONE_OPTIONS,
    set_passport_tone,
    tone_by_index,
    tone_index,
)
from services.brand_passport import fetch_passport_by_org
from services.org_resolver import owner_org_id
from services.telegram_bots import sales_api_base

logger = logging.getLogger(__name__)

TELEGRAM_API = sales_api_base()


def parse_sales_command(text: str | None) -> str:
    if not text or not text.strip().startswith("/"):
        return ""
    return text.strip().split()[0].lower().split("@")[0]


def is_owner_chat(user_id: int | str, chat_id: int | str) -> bool:
    return str(user_id) == str(chat_id) == owner_org_id(chat_id)


async def _answer_callback(callback_query_id: str, text: str | None = None) -> None:
    payload: dict = {"callback_query_id": callback_query_id}
    if text:
        payload["text"] = text
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            await client.post(f"{TELEGRAM_API}/answerCallbackQuery", json=payload)
    except Exception as exc:
        logger.warning("sales config answerCallbackQuery failed: %s", exc)


def _tone_keyboard(current: str | None) -> dict:
    current_idx = tone_index(current)
    rows = []
    for i, label in enumerate(TONE_OPTIONS):
        prefix = "✓ " if current_idx == i else ""
        short = label.split(",")[0]
        rows.append(
            [
                {
                    "text": f"{prefix}{short}",
                    "callback_data": f"{TONE_CALLBACK_PREFIX}{i}",
                }
            ]
        )
    return {"inline_keyboard": rows}


async def _send_with_keyboard(chat_id: int, text: str, *, current: str | None) -> None:
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(
            f"{TELEGRAM_API}/sendMessage",
            json={
                "chat_id": chat_id,
                "text": text,
                "reply_markup": _tone_keyboard(current),
            },
        )


async def handle_config_command(chat_id: int, user_id: int) -> None:
    if not is_owner_chat(user_id, chat_id):
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                f"{TELEGRAM_API}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": (
                        "Bu buyruq faqat biznes egasi uchun.\n"
                        "Mijozlar bilan muloqot Telegram Business orqali avtomatik ishlaydi."
                    ),
                },
            )
        return

    org_id = owner_org_id(chat_id)
    passport = fetch_passport_by_org(org_id)
    if not passport:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                f"{TELEGRAM_API}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": (
                        "Avval brend pasportini saqlang.\n\n"
                        "@ConverzaApp_bot → /fill yoki veb-panel orqali sozlang."
                    ),
                },
            )
        return

    current = passport.get("tone") or TONE_OPTIONS[0]
    text = (
        "🗣 DM Closer ohangi\n\n"
        f"Hozirgi: {current}\n\n"
        "Quyidagi tugmalardan birini tanlang — mijozlarga javob shu ohangda beriladi:"
    )
    await _send_with_keyboard(chat_id, text, current=current)


async def handle_config_callback(callback_query: dict) -> None:
    cb_id = callback_query.get("id")
    data = (callback_query.get("data") or "").strip()
    from_user = callback_query.get("from") or {}
    message = callback_query.get("message") or {}
    chat = message.get("chat") or {}
    chat_id = chat.get("id")
    user_id = from_user.get("id")

    if not cb_id or not chat_id or not user_id:
        return

    if not data.startswith(TONE_CALLBACK_PREFIX):
        await _answer_callback(cb_id, "Noma'lum amal.")
        return

    if not is_owner_chat(user_id, chat_id):
        await _answer_callback(cb_id, "Faqat biznes egasi o'zgartira oladi.")
        return

    try:
        index = int(data[len(TONE_CALLBACK_PREFIX) :])
    except ValueError:
        await _answer_callback(cb_id, "Noto'g'ri tanlov.")
        return

    tone = tone_by_index(index)
    if not tone:
        await _answer_callback(cb_id, "Noto'g'ri tanlov.")
        return

    org_id = owner_org_id(chat_id)
    updated = set_passport_tone(org_id, tone)
    if not updated:
        await _answer_callback(cb_id, "Pasport topilmadi.")
        return

    await _answer_callback(cb_id, f"Ohang: {tone.split(',')[0]}")
    await _send_with_keyboard(
        chat_id,
        f"✅ Saqlandi.\n\n🗣 Yangi ohang: {tone}\n\nMijozlarga keyingi javoblar shu uslubda bo'ladi.",
        current=tone,
    )
