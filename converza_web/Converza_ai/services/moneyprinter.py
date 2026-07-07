"""Optional MoneyPrinterTurbo integration for Vea render queue."""

from __future__ import annotations

import asyncio
import os
from typing import Any

import httpx

TASK_STATE_FAILED = -1
TASK_STATE_COMPLETE = 1
DEFAULT_VOICE_NAME = "en-US-AriaNeural"


def moneyprinter_configured() -> bool:
    return bool((os.getenv("MONEYPRINTERTURBO_BASE_URL") or "").strip())


def _base_url() -> str:
    return os.getenv("MONEYPRINTERTURBO_BASE_URL", "http://127.0.0.1:8080").rstrip("/")


def _absolute_worker_url(value: str, base_url: str) -> str:
    if value.startswith(("http://", "https://")):
        return value
    if value.startswith("/"):
        return f"{base_url}{value}"
    return f"{base_url}/{value}"


async def call_moneyprinterturbo(
    *,
    script: str,
    video_subject: str = "Converza campaign video",
    timeout_seconds: int = 180,
) -> dict[str, Any]:
    if not moneyprinter_configured():
        raise RuntimeError("MONEYPRINTERTURBO_BASE_URL is not configured")

    script = script.strip()
    if not script:
        raise ValueError("MoneyPrinterTurbo requires a non-empty script")

    base_url = _base_url()
    payload = {
        "video_subject": video_subject,
        "video_script": script,
        "video_source": "pexels",
        "video_aspect": "9:16",
        "video_concat_mode": "sequential",
        "video_clip_duration": 5,
        "video_count": 1,
        "video_language": "en",
        "voice_name": DEFAULT_VOICE_NAME,
        "voice_rate": 1.0,
        "voice_volume": 1.0,
        "subtitle_enabled": True,
        "bgm_type": "",
        "bgm_volume": 0,
        "font_size": 54,
        "n_threads": 2,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(f"{base_url}/api/v1/videos", json=payload)
        response.raise_for_status()
        create_data = response.json()
        task_id = (create_data.get("data") or {}).get("task_id")
        if not task_id:
            raise RuntimeError(f"MoneyPrinterTurbo did not return task_id: {create_data}")

        deadline = asyncio.get_event_loop().time() + timeout_seconds
        while asyncio.get_event_loop().time() < deadline:
            poll = await client.get(f"{base_url}/api/v1/tasks/{task_id}")
            poll.raise_for_status()
            task = poll.json().get("data") or {}
            state = task.get("state")
            if state == TASK_STATE_COMPLETE:
                videos = task.get("videos") or []
                if not videos:
                    raise RuntimeError("MoneyPrinterTurbo completed without video URLs")
                video_url = _absolute_worker_url(str(videos[0]), base_url)
                return {"task_id": task_id, "video_url": video_url, "script": script}
            if state == TASK_STATE_FAILED:
                raise RuntimeError(task.get("progress") or "MoneyPrinterTurbo render failed")
            await asyncio.sleep(3)

    raise TimeoutError("MoneyPrinterTurbo render timed out")
