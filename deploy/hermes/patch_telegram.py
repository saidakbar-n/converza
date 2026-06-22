#!/usr/bin/env python3
"""Force Hermes platforms.telegram off and strip bot tokens from config.yaml."""

from __future__ import annotations

import re
import sys
from pathlib import Path

DISABLED_BLOCK = """\
# Converza: Telegram handled by converza_bot webhooks, not Hermes polling
platforms:
  telegram:
    enabled: false
"""


def patch_config(path: Path) -> None:
    if not path.exists():
        return

    text = path.read_text(encoding="utf-8")
    text = re.sub(r"(?m)^[ \t]*bot_token:.*\n", "", text)

    if re.search(r"(?m)^platforms:\s*$", text):
        text = re.sub(
            r"(?m)^platforms:\n(?:^[ \t].*\n)*",
            DISABLED_BLOCK,
            text,
            count=1,
        )
    else:
        text = text.rstrip() + "\n\n" + DISABLED_BLOCK

    text = re.sub(
        r"(?m)(^[ \t]*telegram:\s*\n(?:^[ \t].*\n)*?^[ \t]*enabled:\s*)true",
        r"\1false",
        text,
    )
    path.write_text(text, encoding="utf-8")
    print(f"Patched {path}: platforms.telegram disabled, bot_token removed")


if __name__ == "__main__":
    cfg = Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/hermes/config.yaml")
    patch_config(cfg)
