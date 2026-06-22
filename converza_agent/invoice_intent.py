"""Detect when a DM Closer reply should include a Click invoice."""

from __future__ import annotations

import re

# uz / ru / en — client asks to pay, wants invoice, or confirms purchase
_PAYMENT_PHRASES = (
    r"\bto['']?lov\b",
    r"\btol(?:ov|ayman|ash)\b",
    r"\bclick\b",
    r"\bhisob[\s-]?faktura\b",
    r"\binvoice\b",
    r"\bpay(?:ment|ing)?\b",
    r"\bcheckout\b",
    r"\bbuy\b",
    r"\bpurchase\b",
    r"\bоплат",
    r"\bплат(?:еж|ить|ить)\b",
    r"\bсч[её]т\b",
    r"\bсколько\s+стоит\b",
    r"\bqancha\b",
    r"\bnarx\b",
    r"\bprice\b",
    r"\bhow\s+much\b",
    r"\bтўлов\b",
    r"\bтўламан\b",
)

_PAYMENT_RE = re.compile("|".join(_PAYMENT_PHRASES), re.IGNORECASE)


def inbound_signals_payment(text: str) -> bool:
    """True when the customer message indicates payment or purchase intent."""
    if not (text or "").strip():
        return False
    return bool(_PAYMENT_RE.search(text))


def resolve_invoice_request(
    *,
    invoice_required: bool,
    invoice_tier: str | None,
    client_condition: str,
    inbound_text: str,
    payments_enabled: bool,
) -> tuple[bool, str | None]:
    """
    Decide whether Python should send a Telegram Click invoice after the reply.

    Returns (should_send, tier_name).
    """
    if not payments_enabled:
        return False, None

    tier = (invoice_tier or "").strip() or None

    if invoice_required:
        return True, tier
    if client_condition == "purchasing":
        return True, tier
    if inbound_signals_payment(inbound_text):
        return True, tier
    return False, None
