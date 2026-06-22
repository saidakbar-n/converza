"""Sales bot command routing — business_message /config must not be swallowed."""

import asyncio
from unittest.mock import AsyncMock, patch

from models.schemas import TelegramUpdate
from routers.webhooks import (
    _dispatch_sales_update,
    _handle_sales_direct_message,
    _try_handle_sales_business_command,
)


OWNER_ID = 788881532
CONN_ID = "conn-test-abc"


def _owner_business_config_payload(text: str = "/config") -> dict:
    return {
        "update_id": 9001,
        "business_message": {
            "message_id": 10,
            "from": {"id": OWNER_ID, "is_bot": False, "first_name": "Owner"},
            "chat": {"id": OWNER_ID, "type": "private", "first_name": "Owner"},
            "date": 1,
            "text": text,
            "business_connection_id": CONN_ID,
        },
    }


def test_try_handle_owner_business_config():
    payload = _owner_business_config_payload("/config")
    update = TelegramUpdate.model_validate(payload)

    with (
        patch("routers.webhooks.resolve_org_id", return_value=str(OWNER_ID)),
        patch(
            "routers.webhooks.handle_config_command",
            new_callable=AsyncMock,
        ) as mock_config,
    ):
        handled = asyncio.run(_try_handle_sales_business_command(update, payload))

    assert handled is True
    mock_config.assert_awaited_once_with(OWNER_ID, OWNER_ID)


def test_try_handle_owner_business_help():
    payload = _owner_business_config_payload("/help")
    update = TelegramUpdate.model_validate(payload)

    with (
        patch("routers.webhooks.resolve_org_id", return_value=str(OWNER_ID)),
        patch("routers.webhooks._sales_bot_reply", new_callable=AsyncMock) as mock_reply,
    ):
        handled = asyncio.run(_try_handle_sales_business_command(update, payload))

    assert handled is True
    mock_reply.assert_awaited_once_with(OWNER_ID)


def test_customer_business_message_not_intercepted():
    payload = {
        "update_id": 9002,
        "business_message": {
            "message_id": 11,
            "from": {"id": 999, "is_bot": False, "first_name": "Customer"},
            "chat": {"id": 999, "type": "private"},
            "date": 1,
            "text": "/config",
            "business_connection_id": CONN_ID,
        },
    }
    update = TelegramUpdate.model_validate(payload)

    with patch("routers.webhooks.resolve_org_id", return_value=str(OWNER_ID)):
        handled = asyncio.run(_try_handle_sales_business_command(update, payload))

    assert handled is False


def test_direct_message_config_uses_from_alias():
    payload = {
        "update_id": 9003,
        "message": {
            "message_id": 12,
            "from": {"id": OWNER_ID, "is_bot": False, "first_name": "Owner"},
            "chat": {"id": OWNER_ID, "type": "private", "first_name": "Owner"},
            "date": 1,
            "text": "/config",
        },
    }
    update = TelegramUpdate.model_validate(payload)

    with patch(
        "routers.webhooks.handle_config_command",
        new_callable=AsyncMock,
    ) as mock_config:
        asyncio.run(_handle_sales_direct_message(update))

    mock_config.assert_awaited_once_with(OWNER_ID, OWNER_ID)


def test_dispatch_routes_owner_config_before_ingestor():
    payload = _owner_business_config_payload("/config")
    update = TelegramUpdate.model_validate(payload)

    with (
        patch("routers.webhooks.resolve_org_id", return_value=str(OWNER_ID)),
        patch(
            "routers.webhooks.handle_config_command",
            new_callable=AsyncMock,
        ) as mock_config,
        patch("routers.webhooks.ingest_message", new_callable=AsyncMock) as mock_ingest,
    ):
        asyncio.run(_dispatch_sales_update(update, raw=payload))

    mock_config.assert_awaited_once()
    mock_ingest.assert_not_awaited()
