#!/usr/bin/env python3
"""Force Hermes config.yaml model block to match Converza env (gemini or anthropic)."""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path


def resolve_provider() -> tuple[str, str] | None:
    explicit = os.environ.get("CONVERZA_LLM_PROVIDER", "").strip().lower()
    google = (os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY") or "").strip()
    anthropic = (os.environ.get("ANTHROPIC_API_KEY") or "").strip()

    if explicit == "anthropic":
        if not anthropic:
            return None
        model = os.environ.get("HERMES_ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
        return model, "anthropic"
    if explicit == "gemini":
        if not google:
            return None
        model = os.environ.get("HERMES_GEMINI_MODEL") or os.environ.get("GEMINI_MODEL") or "gemini-2.0-flash"
        return model, "gemini"

    if google:
        model = os.environ.get("HERMES_GEMINI_MODEL") or os.environ.get("GEMINI_MODEL") or "gemini-2.0-flash"
        return model, "gemini"
    if anthropic:
        model = os.environ.get("HERMES_ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
        return model, "anthropic"
    return None


def patch_config(path: Path) -> None:
    resolved = resolve_provider()
    if not resolved or not path.exists():
        return
    model, provider = resolved
    block = f"model:\n  default: {model}\n  provider: {provider}\n"
    text = path.read_text(encoding="utf-8")
    if re.search(r"(?m)^model:\n", text):
        text = re.sub(r"(?m)^model:\n(?:  .+\n)+", block, text, count=1)
    else:
        text = block + "\n" + text
    path.write_text(text, encoding="utf-8")
    print(f"Patched {path}: provider={provider} default={model}")


if __name__ == "__main__":
    cfg = Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/hermes/config.yaml")
    patch_config(cfg)
