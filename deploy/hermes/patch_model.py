#!/usr/bin/env python3
"""Patch Hermes config.yaml model + custom_providers from Converza env."""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

GROQ_BASE = "https://api.groq.com/openai/v1"
GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile"


def _pick_provider() -> tuple[str, str, str] | None:
    """Return (model, provider, kind) where kind is groq|gemini|anthropic."""
    explicit = os.environ.get("CONVERZA_LLM_PROVIDER", "").strip().lower()
    groq = os.environ.get("GROQ_API_KEY", "").strip()
    google = (os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY") or "").strip()
    anthropic = os.environ.get("ANTHROPIC_API_KEY", "").strip()

    if explicit == "groq":
        if not groq:
            return None
        model = os.environ.get("HERMES_GROQ_MODEL", GROQ_DEFAULT_MODEL)
        return model, "custom:groq", "groq"
    if explicit == "anthropic":
        if not anthropic:
            return None
        model = os.environ.get("HERMES_ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
        return model, "anthropic", "anthropic"
    if explicit == "gemini":
        if not google:
            return None
        model = os.environ.get("HERMES_GEMINI_MODEL") or os.environ.get("GEMINI_MODEL") or "gemini-2.0-flash"
        return model, "gemini", "gemini"

    # Auto-detect: prefer Groq when key present (Converza production default).
    if groq:
        model = os.environ.get("HERMES_GROQ_MODEL", GROQ_DEFAULT_MODEL)
        return model, "custom:groq", "groq"
    if anthropic:
        model = os.environ.get("HERMES_ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
        return model, "anthropic", "anthropic"
    if google:
        model = os.environ.get("HERMES_GEMINI_MODEL") or os.environ.get("GEMINI_MODEL") or "gemini-2.0-flash"
        return model, "gemini", "gemini"
    return None


def _replace_model_block(text: str, model: str, provider: str) -> str:
    lines = text.splitlines(keepends=True)
    out: list[str] = []
    i = 0
    replaced = False
    max_tokens = os.environ.get("HERMES_MAX_TOKENS", "4096").strip() or "4096"
    context_length = os.environ.get("HERMES_CONTEXT_LENGTH", "128000").strip() or "128000"
    while i < len(lines):
        if lines[i].startswith("model:"):
            out.append(
                "model:\n"
                f"  default: {model}\n"
                f"  provider: {provider}\n"
                f"  max_tokens: {max_tokens}\n"
                f"  context_length: {context_length}\n"
            )
            replaced = True
            i += 1
            while i < len(lines) and (
                lines[i].startswith("  ") or lines[i].strip() == "" or lines[i].lstrip().startswith("#")
            ):
                i += 1
            continue
        out.append(lines[i])
        i += 1
    if not replaced:
        out.insert(
            0,
            (
                "model:\n"
                f"  default: {model}\n"
                f"  provider: {provider}\n"
                f"  max_tokens: {max_tokens}\n"
                f"  context_length: {context_length}\n\n"
            ),
        )
    return "".join(out)


def _ensure_groq_model_limits(text: str, model: str) -> str:
    """Ensure custom_providers groq entry includes per-model max_tokens/context_length."""
    max_tokens = os.environ.get("HERMES_MAX_TOKENS", "8192").strip() or "8192"
    context_length = os.environ.get("HERMES_CONTEXT_LENGTH", "128000").strip() or "128000"
    model_block = (
        f"    models:\n"
        f"      {model}:\n"
        f"        max_tokens: {max_tokens}\n"
        f"        context_length: {context_length}\n"
    )
    if "name: groq" not in text:
        return text
    if re.search(rf"(?m)^\s+{re.escape(model)}:\s*$", text):
        return text
    return re.sub(
        r"(?m)^(\s+- name: groq\n(?:\s+.+\n)*?)(?=^\S|\Z)",
        lambda m: m.group(1) + model_block,
        text,
        count=1,
    )


def patch_config(path: Path) -> None:
    picked = _pick_provider()
    if not picked or not path.exists():
        return
    model, provider, kind = picked
    text = path.read_text(encoding="utf-8")

    if kind == "groq":
        groq_entry = (
            "  - name: groq\n"
            f"    base_url: {GROQ_BASE}\n"
            "    key_env: GROQ_API_KEY\n"
        )
        if re.search(r"(?m)^custom_providers:\n", text):
            if "name: groq" not in text:
                text = re.sub(
                    r"(?m)^custom_providers:\n",
                    f"custom_providers:\n{groq_entry}",
                    text,
                    count=1,
                )
        else:
            text = f"custom_providers:\n{groq_entry}\n" + text

    text = _replace_model_block(text, model, provider)
    if kind == "groq":
        text = _ensure_groq_model_limits(text, model)
    path.write_text(text, encoding="utf-8")
    print(f"Patched {path}: provider={provider} default={model}")


if __name__ == "__main__":
    cfg = Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/hermes/config.yaml")
    patch_config(cfg)
