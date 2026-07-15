"""Deterministic client-style features for DM closer tone blending.

Latent LLM tone guessing is unreliable and expensive. Same inbound history must
produce the same style features every time.
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from typing import Any


_EMOJI_RE = re.compile(
    "["
    "\U0001F300-\U0001F9FF"
    "\U00002700-\U000027BF"
    "\U0001F600-\U0001F64F"
    "\U0001F680-\U0001F6FF"
    "]+",
    flags=re.UNICODE,
)
_FORMAL_RE = re.compile(
    r"\b(assalomu alaykum|hurmatli|iltimos|rahmat|please|thank you|"
    r"здравствуйте|пожалуйста|спасибо|尊敬|您好)\b",
    re.I,
)
_CASUAL_RE = re.compile(
    r"\b(bro|brother|hey|yo|salom|aka|opa|qales|vazelin|ok|oka|"
    r"привет|ок|норм|ага)\b",
    re.I,
)
_SHORT_ACK_RE = re.compile(
    r"^(ok|okay|oke|ха|да|yo'?q|нет|ha|хе|yes|no|👍+|🙏+|😊+)$",
    re.I,
)


@dataclass(frozen=True)
class ClientStyle:
    formality: str  # formal | neutral | casual
    avg_chars: int
    emoji_rate: float
    uses_emoji: bool
    uses_short_acks: bool
    lang_hint: str  # opaque passthrough if provided


def _client_turns(history: list[dict[str, Any]] | None, inbound: str) -> list[str]:
    turns: list[str] = []
    for row in history or []:
        role = str(row.get("role") or row.get("direction") or "").lower()
        content = str(row.get("content") or "").strip()
        if not content:
            continue
        if role in ("user", "customer", "inbound", "client"):
            turns.append(content)
    inbound = (inbound or "").strip()
    if inbound:
        turns.append(inbound)
    return turns[-6:]


def extract_client_style(
    inbound_text: str,
    history: list[dict[str, Any]] | None = None,
    *,
    lang_hint: str = "",
) -> ClientStyle:
    turns = _client_turns(history, inbound_text)
    if not turns:
        return ClientStyle(
            formality="neutral",
            avg_chars=0,
            emoji_rate=0.0,
            uses_emoji=False,
            uses_short_acks=False,
            lang_hint=lang_hint,
        )

    lengths = [len(t) for t in turns]
    avg_chars = int(round(sum(lengths) / len(lengths)))
    emoji_hits = sum(1 for t in turns if _EMOJI_RE.search(t))
    emoji_rate = round(emoji_hits / len(turns), 2)
    short_acks = sum(1 for t in turns if _SHORT_ACK_RE.match(t.strip()))
    formal_hits = sum(1 for t in turns if _FORMAL_RE.search(t))
    casual_hits = sum(1 for t in turns if _CASUAL_RE.search(t))

    if formal_hits > casual_hits and formal_hits > 0:
        formality = "formal"
    elif casual_hits > formal_hits and casual_hits > 0:
        formality = "casual"
    elif avg_chars <= 40 and short_acks >= 1:
        formality = "casual"
    else:
        formality = "neutral"

    return ClientStyle(
        formality=formality,
        avg_chars=avg_chars,
        emoji_rate=emoji_rate,
        uses_emoji=emoji_rate > 0,
        uses_short_acks=short_acks > 0,
        lang_hint=lang_hint,
    )


def blend_tone(brand_tone: str | None, style: ClientStyle) -> str:
    """Keep brand tone as anchor; layer client style as delivery constraints."""
    anchor = (brand_tone or "").strip() or "Samimiy, ishonchli va lo'nda"
    parts = [f"Brand tone: {anchor}"]

    if style.formality == "formal":
        parts.append("Client style: formal — polite openings, complete sentences.")
    elif style.formality == "casual":
        parts.append("Client style: casual — short, warm, plain words.")
    else:
        parts.append("Client style: neutral — clear and natural.")

    if style.avg_chars and style.avg_chars < 60:
        parts.append("Keep replies short (1–3 sentences).")
    elif style.avg_chars and style.avg_chars > 180:
        parts.append("Client writes longer — allow one denser paragraph if needed.")

    if style.uses_emoji:
        parts.append("Client uses emoji — one matching emoji is ok.")
    else:
        parts.append("Client avoids emoji — do not introduce emoji.")

    if style.uses_short_acks:
        parts.append("Client answers briefly — one clear next step only.")

    return " ".join(parts)


def compact_brand_context(brand: dict | None) -> dict[str, Any]:
    """Shrink passport payload so closer fits small VPS / Groq / Hermes limits."""
    src = dict(brand or {})
    pricing = src.get("pricing") or []
    slim_pricing: list[dict[str, Any]] = []
    if isinstance(pricing, list):
        for item in pricing[:6]:
            if not isinstance(item, dict):
                continue
            slim_pricing.append(
                {
                    "tier": item.get("tier") or item.get("name") or "",
                    "price": item.get("price") or "",
                }
            )

    faq = src.get("faq") or []
    slim_faq: list[dict[str, Any]] = []
    if isinstance(faq, list):
        for item in faq[:4]:
            if not isinstance(item, dict):
                continue
            q = str(item.get("question") or item.get("q") or "").strip()
            a = str(item.get("answer") or item.get("a") or "").strip()
            if q:
                slim_faq.append({"question": q[:160], "answer": a[:240]})

    objections = src.get("objections") or []
    slim_obj: list[dict[str, Any]] = []
    if isinstance(objections, list):
        for item in objections[:3]:
            if not isinstance(item, dict):
                continue
            slim_obj.append(
                {
                    "objection": str(item.get("objection") or "")[:160],
                    "response": str(item.get("response") or "")[:240],
                }
            )

    notes = str(src.get("raw_notes") or "")
    if len(notes) > 800:
        notes = notes[:800] + "…"

    return {
        "brand_name": src.get("brand_name"),
        "industry": src.get("industry"),
        "target_audience": src.get("target_audience"),
        "core_offer": src.get("core_offer"),
        "target_location": src.get("target_location"),
        "tone": src.get("tone") or src.get("brand_voice"),
        "pricing": slim_pricing,
        "faq": slim_faq,
        "objections": slim_obj,
        "raw_notes": notes,
    }


def style_as_dict(style: ClientStyle) -> dict[str, Any]:
    return asdict(style)
