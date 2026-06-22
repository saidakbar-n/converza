"""LLM — streams Co-Pilot via Groq (preferred) or Hermes."""

from typing import AsyncGenerator

from converza_agent.prompts.copilot import COPILOT_SYSTEM_PROMPT
from converza_agent.runtime import stream_copilot


async def stream_gemini(
    messages: list[dict],
    system_prompt: str | None = None,
    model: str | None = None,
    max_tokens: int = 4096,
) -> AsyncGenerator[str, None]:
    """Legacy name kept for /chat SSE handler."""
    del model
    async for token in stream_copilot(
        messages,
        system_prompt=system_prompt or COPILOT_SYSTEM_PROMPT,
        max_tokens=max_tokens,
    ):
        yield token
