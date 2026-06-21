"""Direct Groq chat completions — bypasses Hermes agent loop for lightweight tasks."""

from __future__ import annotations

import os

import httpx

from converza_agent.json_utils import extract_json_object

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "llama-3.3-70b-versatile"


def _groq_key() -> str:
    return (os.getenv("GROQ_API_KEY") or "").strip()


def _groq_model() -> str:
    return (
        os.getenv("HERMES_GROQ_MODEL")
        or os.getenv("GROQ_MODEL")
        or DEFAULT_MODEL
    ).strip()


def groq_configured() -> bool:
    return bool(_groq_key())


async def groq_complete_json(
    system: str,
    user_content: str,
    *,
    max_tokens: int = 600,
    temperature: float = 0.3,
) -> dict:
    key = _groq_key()
    if not key:
        raise RuntimeError("GROQ_API_KEY is not set")

    system = system.rstrip()
    if "json" not in system.lower():
        system += "\n\nRespond with a single json object only."

    body = {
        "model": _groq_model(),
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_content},
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            json=body,
        )
        if resp.status_code != 200:
            raise RuntimeError(f"Groq returned {resp.status_code}: {resp.text[:500]}")
        data = resp.json()

    try:
        text = data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(f"Unexpected Groq response: {data!r}") from exc

    return extract_json_object(text)
