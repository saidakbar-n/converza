"""HTTP client for the Hermes Agent OpenAI-compatible API server."""

from __future__ import annotations

import json
import logging
from typing import Any, AsyncGenerator

import httpx

from converza_agent.config import hermes_api_key, hermes_base_url, hermes_model

logger = logging.getLogger(__name__)

_client: "HermesClient | None" = None


class HermesError(RuntimeError):
    pass


class HermesClient:
    def __init__(
        self,
        *,
        base_url: str | None = None,
        api_key: str | None = None,
        model: str | None = None,
        timeout: float = 120.0,
    ) -> None:
        self.base_url = (base_url or hermes_base_url()).rstrip("/")
        self.api_key = (
            api_key.strip() if api_key is not None else hermes_api_key()
        )
        self.model = model or hermes_model()
        self.timeout = timeout

    def _headers(self, session_key: str | None = None) -> dict[str, str]:
        if not self.api_key:
            raise HermesError(
                "HERMES_API_KEY is not set. Start the Hermes gateway with API_SERVER_ENABLED=true."
            )
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        if session_key:
            headers["X-Hermes-Session-Key"] = session_key
        return headers

    def _build_messages(
        self,
        messages: list[dict[str, Any]],
        *,
        system: str | None = None,
    ) -> list[dict[str, Any]]:
        payload = list(messages)
        if system:
            payload = [{"role": "system", "content": system}, *payload]
        return payload

    async def complete(
        self,
        messages: list[dict[str, Any]],
        *,
        system: str | None = None,
        session_key: str | None = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ) -> str:
        body = {
            "model": self.model,
            "messages": self._build_messages(messages, system=system),
            "stream": False,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        url = f"{self.base_url}/v1/chat/completions"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, headers=self._headers(session_key), json=body)
            if resp.status_code != 200:
                raise HermesError(
                    f"Hermes returned {resp.status_code}: {resp.text[:500]}"
                )
            data = resp.json()
        try:
            return data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError, TypeError) as exc:
            raise HermesError(f"Unexpected Hermes response shape: {data!r}") from exc

    async def complete_json(
        self,
        messages: list[dict[str, Any]],
        *,
        system: str | None = None,
        session_key: str | None = None,
        max_tokens: int = 4096,
        temperature: float = 0.3,
    ) -> dict:
        from converza_agent.json_utils import extract_json_object

        text = await self.complete(
            messages,
            system=system,
            session_key=session_key,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return extract_json_object(text)

    async def stream(
        self,
        messages: list[dict[str, Any]],
        *,
        system: str | None = None,
        session_key: str | None = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ) -> AsyncGenerator[str, None]:
        body = {
            "model": self.model,
            "messages": self._build_messages(messages, system=system),
            "stream": True,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        url = f"{self.base_url}/v1/chat/completions"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            async with client.stream(
                "POST",
                url,
                headers=self._headers(session_key),
                json=body,
            ) as resp:
                if resp.status_code != 200:
                    detail = await resp.aread()
                    raise HermesError(
                        f"Hermes stream failed ({resp.status_code}): "
                        f"{detail.decode()[:500]}"
                    )
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    raw = line[6:].strip()
                    if not raw or raw == "[DONE]":
                        continue
                    try:
                        chunk = json.loads(raw)
                    except json.JSONDecodeError:
                        continue
                    content = chunk.get("choices", [{}])[0].get("delta", {}).get(
                        "content"
                    )
                    if content:
                        yield content

    async def ping(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/health")
                return resp.status_code == 200
        except Exception:
            return False


def get_hermes_client() -> HermesClient:
    global _client
    if _client is None:
        _client = HermesClient()
    return _client
