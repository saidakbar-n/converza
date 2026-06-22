"""Extract customer text and metadata from Telegram webhook payloads."""

from __future__ import annotations

from models.schemas import TelegramMessage, TelegramUpdate, TelegramUser

BUSINESS_MESSAGE_KEYS = ("business_message", "edited_business_message")


def raw_business_message(raw: dict | None) -> dict | None:
    if not raw:
        return None
    for key in BUSINESS_MESSAGE_KEYS:
        msg = raw.get(key)
        if isinstance(msg, dict):
            return msg
    return None


def is_outgoing_business_echo(raw_msg: dict) -> bool:
    """True for messages sent by the bot on the business connection (not customer inbound)."""
    return bool(raw_msg.get("sender_business_bot"))


def is_business_owner_sender(sender_id: int | str | None, org_id: str) -> bool:
    """True when the Telegram Business account owner sent the message (not a customer)."""
    if sender_id is None or not org_id:
        return False
    return str(sender_id) == str(org_id)


def extract_message_text(msg: TelegramMessage | None, raw_msg: dict | None) -> str:
    """Prefer raw JSON text — Pydantic can miss fields on some business_message payloads."""
    candidates: list[str | None] = []
    if raw_msg:
        candidates.extend([raw_msg.get("text"), raw_msg.get("caption")])
    if msg:
        candidates.extend([msg.text, msg.caption])
    for value in candidates:
        if value and str(value).strip():
            return str(value).strip()
    return ""


def extract_sender(msg: TelegramMessage | None, raw_msg: dict | None) -> TelegramUser | None:
    if msg and msg.from_:
        return msg.from_
    if raw_msg and isinstance(raw_msg.get("from"), dict):
        data = raw_msg["from"]
        try:
            return TelegramUser.model_validate(data)
        except Exception:
            uid = data.get("id")
            if uid is not None:
                return TelegramUser(
                    id=int(uid),
                    is_bot=bool(data.get("is_bot", False)),
                    first_name=str(data.get("first_name") or "Customer"),
                    username=data.get("username"),
                    language_code=data.get("language_code"),
                )
    return None


def resolve_inbound_message(
    update: TelegramUpdate,
    raw: dict | None = None,
) -> tuple[TelegramMessage | None, dict | None, str, bool]:
    """
    Return (parsed_message, raw_message_dict, text, is_business).

    is_business is True when the payload is business_message / edited_business_message.
    """
    raw = raw or update.model_dump(by_alias=True)
    raw_msg = raw_business_message(raw)
    if raw_msg:
        parsed = update.business_message
        if parsed is None:
            try:
                parsed = TelegramMessage.model_validate(raw_msg)
            except Exception:
                parsed = None
        text = extract_message_text(parsed, raw_msg)
        return parsed, raw_msg, text, True

    if update.business_message:
        raw_msg = raw.get("business_message")
        if isinstance(raw_msg, dict):
            return (
                update.business_message,
                raw_msg,
                extract_message_text(update.business_message, raw_msg),
                True,
            )

    if update.message:
        raw_msg = raw.get("message")
        rm = raw_msg if isinstance(raw_msg, dict) else None
        return update.message, rm, extract_message_text(update.message, rm), False

    return None, None, "", False
