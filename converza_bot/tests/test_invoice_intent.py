"""Tests for Click invoice intent detection."""

from converza_agent.closer_schema import normalize_closer_json
from converza_agent.invoice_intent import inbound_signals_payment, resolve_invoice_request


def test_inbound_signals_payment_uz():
    assert inbound_signals_payment("Click orqali to'layman")
    assert inbound_signals_payment("Qancha turadi?")


def test_inbound_signals_payment_ru_en():
    assert inbound_signals_payment("How do I pay?")
    assert inbound_signals_payment("Хочу оплатить")


def test_inbound_signals_payment_negative():
    assert not inbound_signals_payment("Salom")
    assert not inbound_signals_payment("")


def test_resolve_invoice_when_llm_flags_required():
    send, tier = resolve_invoice_request(
        invoice_required=True,
        invoice_tier="Pro",
        client_condition="warm",
        inbound_text="ok",
        payments_enabled=True,
    )
    assert send is True
    assert tier == "Pro"


def test_resolve_invoice_when_purchasing():
    send, tier = resolve_invoice_request(
        invoice_required=False,
        invoice_tier=None,
        client_condition="purchasing",
        inbound_text="ha",
        payments_enabled=True,
    )
    assert send is True


def test_resolve_invoice_from_inbound_keywords():
    send, _ = resolve_invoice_request(
        invoice_required=False,
        invoice_tier=None,
        client_condition="warm",
        inbound_text="Invoice yuboring",
        payments_enabled=True,
    )
    assert send is True


def test_resolve_invoice_disabled_without_click():
    send, _ = resolve_invoice_request(
        invoice_required=True,
        invoice_tier="Pro",
        client_condition="purchasing",
        inbound_text="to'layman",
        payments_enabled=False,
    )
    assert send is False


def test_normalize_purchasing_sets_invoice_required():
    out = normalize_closer_json(
        {
            "reply": "Yuboraman",
            "client_condition": "purchasing",
            "invoice_required": False,
        }
    )
    assert out["invoice_required"] is True
