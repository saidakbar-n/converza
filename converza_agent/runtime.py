"""
Hermes agent runtime — thin dispatch layer.

All reasoning lives in Hermes + Converza MCP tools + skill prompts.
Python only routes tasks and handles transport (Telegram HITL, SSE).
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, AsyncGenerator

from converza_agent.client import HermesClient, get_hermes_client

_SKILLS_DIR = Path(__file__).resolve().parent.parent / "deploy" / "hermes" / "skills"

AGENT_SKILL_FILES = {
    "dm-closer": "converza-dm-closer.md",
    "copilot": "converza-copilot.md",
    "passport-extract": "converza-passport-extract.md",
    "manager": "converza-manager.md",
    "orchestrator": "converza-orchestrator.md",
    "auditor": "converza-auditor.md",
}


def load_skill_prompt(agent_id: str) -> str:
    filename = AGENT_SKILL_FILES.get(agent_id)
    if not filename:
        raise ValueError(f"Unknown agent: {agent_id}")
    path = _SKILLS_DIR / filename
    if path.exists():
        return path.read_text(encoding="utf-8")
    return f"You are the Converza agent `{agent_id}`. Use Converza MCP tools when needed."


def _mcp_preamble() -> str:
    return (
        "You have access to Converza MCP tools (get_brand_context, get_message_history, "
        "set_prospect_condition, record_outbound_message, telegram_send_text, "
        "telegram_send_click_invoice, get_org_stats). "
        "Always use tools for data — never invent brand facts.\n\n"
    )


async def run_agent_text(
    agent_id: str,
    messages: list[dict[str, Any]],
    *,
    session_key: str | None = None,
    max_tokens: int = 4096,
    temperature: float = 0.5,
    client: HermesClient | None = None,
) -> str:
    hermes = client or get_hermes_client()
    system = _mcp_preamble() + load_skill_prompt(agent_id)
    return await hermes.complete(
        messages,
        system=system,
        session_key=session_key,
        max_tokens=max_tokens,
        temperature=temperature,
    )


async def run_dm_closer_json(
    user_content: str,
    *,
    max_tokens: int = 600,
    temperature: float = 0.3,
) -> dict:
    """
    DM Closer JSON reply.

    Uses direct Groq when GROQ_API_KEY is set (avoids Hermes MCP context limits on
    small VPS). Falls back to Hermes otherwise.
    """
    from converza_agent.closer_schema import normalize_closer_json
    from converza_agent.groq_client import groq_complete_json, groq_configured

    system = load_skill_prompt("dm-closer")
    schema_hint = (
        "\n\nOUTPUT SCHEMA (exact keys only — no response, confidence, intent, or extra fields):\n"
        '{"reply":"...","client_condition":"cold|warm|purchasing|closed",'
        '"condition_reason":"...","invoice_required":false,"invoice_tier":null}'
    )
    system = system.rstrip() + schema_hint

    if groq_configured():
        raw = await groq_complete_json(
            system,
            user_content,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return normalize_closer_json(raw)

    raw = await run_agent_json(
        "dm-closer",
        [{"role": "user", "content": user_content}],
        session_key=None,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return normalize_closer_json(raw)


async def run_agent_json(
    agent_id: str,
    messages: list[dict[str, Any]],
    *,
    session_key: str | None = None,
    max_tokens: int = 4096,
    temperature: float = 0.3,
    client: HermesClient | None = None,
) -> dict:
    hermes = client or get_hermes_client()
    skill = load_skill_prompt(agent_id)
    if agent_id == "dm-closer":
        system = skill
    else:
        system = _mcp_preamble() + skill
    return await hermes.complete_json(
        messages,
        system=system,
        session_key=session_key,
        max_tokens=max_tokens,
        temperature=temperature,
    )


async def stream_agent(
    agent_id: str,
    messages: list[dict[str, Any]],
    *,
    session_key: str | None = None,
    max_tokens: int = 4096,
    temperature: float = 0.6,
    client: HermesClient | None = None,
) -> AsyncGenerator[str, None]:
    hermes = client or get_hermes_client()
    system = _mcp_preamble() + load_skill_prompt(agent_id)
    async for token in hermes.stream(
        messages,
        system=system,
        session_key=session_key,
        max_tokens=max_tokens,
        temperature=temperature,
    ):
        yield token
