"""Tests for Telegram business_message text extraction."""

from models.schemas import TelegramUpdate
from services.telegram_inbound import (
    extract_message_text,
    is_business_owner_sender,
    is_outgoing_business_echo,
    raw_business_message,
    resolve_inbound_message,
)


def test_raw_business_message_text_when_pydantic_parsed():
    payload = {
        "update_id": 1,
        "business_message": {
            "message_id": 10,
            "from": {"id": 99, "is_bot": False, "first_name": "Ali"},
            "chat": {"id": 99, "type": "private", "first_name": "Ali"},
            "date": 1,
            "text": "Salom, narx qancha?",
            "business_connection_id": "conn-abc",
        },
    }
    update = TelegramUpdate.model_validate(payload)
    msg, raw_msg, text, is_business = resolve_inbound_message(update, payload)
    assert is_business is True
    assert text == "Salom, narx qancha?"
    assert raw_msg is not None
    assert extract_message_text(msg, raw_msg) == text


def test_extract_text_from_raw_when_model_missing_text():
    payload = {
        "update_id": 2,
        "business_message": {
            "message_id": 11,
            "from": {"id": 100, "is_bot": False, "first_name": "Zara"},
            "chat": {"id": 100, "type": "private"},
            "date": 2,
            "text": "Xizmat haqida",
            "business_connection_id": "conn-xyz",
        },
    }
    update = TelegramUpdate.model_validate(payload)
    # Simulate pydantic dropping text (defensive path uses raw JSON)
    if update.business_message:
        update.business_message.text = None
    _, raw_msg, text, _ = resolve_inbound_message(update, payload)
    assert text == "Xizmat haqida"
    assert raw_msg == payload["business_message"]


def test_edited_business_message():
    payload = {
        "update_id": 3,
        "edited_business_message": {
            "message_id": 12,
            "from": {"id": 101, "is_bot": False, "first_name": "Test"},
            "chat": {"id": 101, "type": "private"},
            "date": 3,
            "edit_date": 4,
            "text": "Tuzatilgan savol",
            "business_connection_id": "conn-1",
        },
    }
    update = TelegramUpdate.model_validate(payload)
    _, _, text, is_business = resolve_inbound_message(update, payload)
    assert is_business is True
    assert text == "Tuzatilgan savol"
    assert raw_business_message(payload) is not None


def test_skip_outgoing_business_echo():
    payload = {
        "message_id": 1,
        "sender_business_bot": {"id": 1, "is_bot": True, "first_name": "Bot"},
        "chat": {"id": 2, "type": "private"},
        "date": 1,
        "text": "Bot javobi",
        "business_connection_id": "conn-1",
    }
    assert is_outgoing_business_echo(payload) is True


def test_business_owner_sender():
    assert is_business_owner_sender(788881532, "788881532") is True
    assert is_business_owner_sender(1970617659, "788881532") is False
    assert is_business_owner_sender(None, "788881532") is False
    assert is_business_owner_sender(788881532, "") is False


def test_caption_fallback():
    payload = {
        "message_id": 1,
        "from": {"id": 1, "is_bot": False, "first_name": "A"},
        "chat": {"id": 1, "type": "private"},
        "date": 1,
        "photo": [{"file_id": "x", "width": 1, "height": 1}],
        "caption": "Rasm ostidagi savol",
    }
    assert extract_message_text(None, payload) == "Rasm ostidagi savol"
