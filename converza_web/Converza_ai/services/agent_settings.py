"""Org-level model role catalog and resolution for switchboard agents."""

from __future__ import annotations

from typing import Any

DEFAULT_ROLE_MODELS: dict[str, str] = {
    "strategist": "sonnet-4-7",
    "copywriter": "sonnet-4-7",
    "video": "haiku-4-7",
    "analyst": "opus-4-7",
}

MODEL_CATALOG: dict[str, dict[str, Any]] = {
    "sonnet-4-7": {
        "label": "Claude Sonnet 4.7",
        "tag": "Default",
        "speed": "Fast",
        "cost": "$3 / 1M",
        "groq_model": "llama-3.3-70b-versatile",
        "max_tokens": 1200,
        "temperature": 0.5,
    },
    "opus-4-7": {
        "label": "Claude Opus 4.7",
        "tag": "Heavy reasoning",
        "speed": "Slow",
        "cost": "$15 / 1M",
        "groq_model": "llama-3.3-70b-versatile",
        "max_tokens": 2000,
        "temperature": 0.4,
    },
    "haiku-4-7": {
        "label": "Claude Haiku 4.7",
        "tag": "Bulk runs",
        "speed": "Instant",
        "cost": "$0.50 / 1M",
        "groq_model": "llama-3.1-8b-instant",
        "max_tokens": 900,
        "temperature": 0.45,
    },
}

AGENT_ROLE_MAP: dict[str, str] = {
    "milo": "strategist",
    "sleyz": "copywriter",
    "vea": "video",
    "copilot": "strategist",
}

ROLE_HINTS: dict[str, str] = {
    "strategist": "Co-Pilot conversations + plan compilation",
    "copywriter": "Hooks, captions, ad variants",
    "video": "Cut sequencing + B-roll selection",
    "analyst": "BudgetBrain, performance reads",
}


def catalog_payload() -> dict[str, Any]:
    roles = [
        {
            "id": role_id,
            "label": role_id.replace("_", " ").title(),
            "hint": ROLE_HINTS.get(role_id, ""),
            "default_model": DEFAULT_ROLE_MODELS[role_id],
        }
        for role_id in DEFAULT_ROLE_MODELS
    ]
    models = [
        {
            "id": model_id,
            "label": meta["label"],
            "tag": meta["tag"],
            "speed": meta["speed"],
            "cost": meta["cost"],
        }
        for model_id, meta in MODEL_CATALOG.items()
    ]
    return {"roles": roles, "models": models, "defaults": dict(DEFAULT_ROLE_MODELS)}


def resolve_agent_model(agent_slug: str, org_settings: dict[str, str] | None = None) -> dict[str, Any]:
    role = AGENT_ROLE_MAP.get(agent_slug, "strategist")
    picks = org_settings or {}
    model_id = picks.get(role) or DEFAULT_ROLE_MODELS.get(role, "sonnet-4-7")
    meta = MODEL_CATALOG.get(model_id, MODEL_CATALOG["sonnet-4-7"])
    return {
        "role": role,
        "model_id": model_id,
        "groq_model": meta["groq_model"],
        "max_tokens": meta["max_tokens"],
        "temperature": meta["temperature"],
    }
