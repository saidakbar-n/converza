"""Normalize DM Closer LLM json to the contract closer.py expects."""

from __future__ import annotations

_VALID_CONDITIONS = frozenset({"cold", "warm", "purchasing", "closed"})


def normalize_closer_json(raw: dict | None) -> dict:
    """Map alternate Groq/Hermes shapes to {reply, client_condition, ...}."""
    if not raw:
        return {
            "reply": "",
            "client_condition": "cold",
            "condition_reason": "",
            "invoice_required": False,
            "invoice_tier": None,
        }

    reply = (
        raw.get("reply")
        or raw.get("response")
        or raw.get("message")
        or raw.get("text")
        or raw.get("answer")
        or ""
    )
    if isinstance(reply, dict):
        reply = reply.get("text") or reply.get("content") or ""
    reply = str(reply).strip()

    condition = str(raw.get("client_condition") or raw.get("condition") or "").strip().lower()
    intent = str(raw.get("intent") or "").strip().lower()
    if condition not in _VALID_CONDITIONS:
        if intent in ("pricing", "price", "purchase", "buy"):
            condition = "warm"
        elif intent in ("closed", "paid", "purchase_complete"):
            condition = "closed"
        else:
            condition = "warm" if reply else "cold"

    reason = str(
        raw.get("condition_reason") or raw.get("reason") or intent or ""
    ).strip()

    invoice_required = bool(raw.get("invoice_required"))
    if not invoice_required and intent in ("invoice", "payment", "pay"):
        invoice_required = True
    if not invoice_required and condition == "purchasing":
        invoice_required = True

    tier = raw.get("invoice_tier")
    if tier is not None and not str(tier).strip():
        tier = None

    return {
        "reply": reply,
        "client_condition": condition,
        "condition_reason": reason,
        "invoice_required": invoice_required,
        "invoice_tier": tier,
    }
