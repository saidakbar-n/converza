"""Send Converza subscription invoices via @ConverzaApp_bot + Click."""

from __future__ import annotations

import logging
import os

import httpx

from services.payments import is_configured_provider_token

logger = logging.getLogger(__name__)

DEFAULT_PRICE_UZS = int(os.getenv("CONVERZA_SUBSCRIPTION_PRICE_UZS", "500000"))


def get_subscription_provider_token() -> str:
    for key in (
        "CONVERZA_SUBSCRIPTION_PROVIDER_TOKEN",
        "CONVERZA_CLICK_PROVIDER_TOKEN",
        "CLICK_TEST_PROVIDER_TOKEN",
    ):
        candidate = (os.getenv(key) or "").strip()
        if is_configured_provider_token(candidate):
            return candidate
    return ""


def subscription_payments_configured() -> bool:
    return bool(get_subscription_provider_token())


def app_bot_api_base() -> str:
    token = (os.getenv("TELEGRAM_APP_BOT_TOKEN") or "").strip()
    if not token:
        return ""
    return f"https://api.telegram.org/bot{token}"


async def send_subscription_invoice(chat_id: int, org_id: str) -> tuple[bool, str]:
    token = get_subscription_provider_token()
    if not is_configured_provider_token(token):
        bot = os.getenv("TELEGRAM_APP_BOT_USERNAME", "ConverzaApp_bot")
        return False, (
            f"Subscription payments are not configured yet. Open @{bot} and send /subscribe, "
            "or contact support."
        )

    amount = DEFAULT_PRICE_UZS
    body = {
        "chat_id": chat_id,
        "title": "Converza monthly plan"[:32],
        "description": (
            "DM Closer + Co-Pilot — Telegram sales automation (30 days)"
        )[:255],
        "payload": f"subscription_{org_id}",
        "provider_token": token,
        "currency": "UZS",
        "prices": [{"label": "Monthly plan"[:32], "amount": amount}],
    }
    api = app_bot_api_base()
    if not api:
        return False, "App bot token is not configured."

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(f"{api}/sendInvoice", json=body)
    if resp.is_success:
        return True, "Invoice sent in Telegram. Complete payment there to activate Pilot."
    logger.warning("sendInvoice failed: %s", resp.text[:240])
    return False, f"Could not send invoice: {resp.text[:200]}"
