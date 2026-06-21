"""Telegram send helpers used by MCP tools."""

import os
import re

import httpx

DEFAULT_USD_TO_UZS = int(os.getenv("USD_TO_UZS", "12500"))
DEFAULT_INVOICE_AMOUNT_UZS = int(os.getenv("DEFAULT_INVOICE_AMOUNT_UZS", "375000"))
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}" if TELEGRAM_BOT_TOKEN else ""


def _price_to_uzs(price: object) -> int | None:
    if price is None:
        return None
    if isinstance(price, (int, float)):
        return int(round(float(price)))
    text = str(price).strip()
    if not text:
        return None
    is_usd = "$" in text or "usd" in text.lower()
    digits = re.sub(r"[^\d.]", "", text.replace(" ", "").replace("'", ""))
    if not digits:
        return None
    try:
        amount = float(digits)
    except ValueError:
        return None
    if is_usd:
        amount *= DEFAULT_USD_TO_UZS
    val = int(round(amount))
    return val if val > 0 else None


def select_invoice_item(brand: dict, requested_tier: str | None = None) -> dict:
    pricing = brand.get("pricing") or []
    selected = None
    if requested_tier:
        req = requested_tier.lower()
        selected = next(
            (
                item
                for item in pricing
                if req in str(item.get("tier", "")).lower()
                or req in str(item.get("name", "")).lower()
            ),
            None,
        )
    if not selected and pricing:
        selected = pricing[0]
    selected = selected or {}
    tier = selected.get("tier") or selected.get("name") or "DM Closer"
    amount = _price_to_uzs(selected.get("price") or selected.get("amount")) or DEFAULT_INVOICE_AMOUNT_UZS
    features = selected.get("features") or []
    description = ", ".join(features[:3]) if features else brand.get("core_offer", "Telegram DM Closer")
    return {
        "title": f"{brand.get('brand_name', 'Converza')} {tier}"[:32],
        "description": description[:255],
        "label": str(tier)[:32],
        "amount": amount,
    }


async def send_message(chat_id: int, text: str, business_connection_id: str | None = None) -> dict:
    payload: dict = {"chat_id": chat_id, "text": text}
    if business_connection_id:
        payload["business_connection_id"] = business_connection_id
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(f"{TELEGRAM_API}/sendMessage", json=payload)
        return {"ok": resp.is_success, "status": resp.status_code, "body": resp.text[:500]}


async def send_invoice(
    chat_id: int,
    provider_token: str,
    prospect_id: str,
    invoice_item: dict,
    business_connection_id: str | None = None,
) -> dict:
    body: dict = {
        "chat_id": chat_id,
        "title": invoice_item["title"][:32],
        "description": invoice_item["description"][:255],
        "payload": f"invoice_{prospect_id}",
        "provider_token": provider_token,
        "currency": "UZS",
        "prices": [{"label": invoice_item["label"][:32], "amount": invoice_item["amount"]}],
    }
    if business_connection_id:
        body["business_connection_id"] = business_connection_id
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(f"{TELEGRAM_API}/sendInvoice", json=body)
        return {"ok": resp.is_success, "status": resp.status_code, "body": resp.text[:500]}
