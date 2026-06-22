"""Bot command menu configuration and Hermes telegram patcher."""

import importlib.util
from pathlib import Path

from main import APP_COMMANDS, SALES_COMMANDS, _COMMAND_REFRESH_DELAYS_SEC

_PATCH_TELEGRAM = Path(__file__).resolve().parents[2] / "deploy" / "hermes" / "patch_telegram.py"
_spec = importlib.util.spec_from_file_location("patch_telegram", _PATCH_TELEGRAM)
assert _spec and _spec.loader
_patch_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_patch_mod)
patch_config = _patch_mod.patch_config


def test_sales_commands_include_config():
    cmds = [c["command"] for c in SALES_COMMANDS]
    assert cmds == ["config", "start", "help"]


def test_app_commands_no_hermes_agent_cmds():
    cmds = {c["command"] for c in APP_COMMANDS}
    assert "new" not in cmds
    assert "model" not in cmds
    assert "start" in cmds


def test_command_refresh_schedule_covers_hermes_startup():
    assert _COMMAND_REFRESH_DELAYS_SEC[0] == 15
    assert max(_COMMAND_REFRESH_DELAYS_SEC) >= 600


def test_patch_telegram_disables_platform_and_strips_bot_token(tmp_path: Path):
    cfg = tmp_path / "config.yaml"
    cfg.write_text(
        """model:
  default: test
platforms:
  telegram:
    enabled: true
    bot_token: "123:ABC"
mcp_servers:
  converza:
    command: python3
""",
        encoding="utf-8",
    )
    patch_config(cfg)
    text = cfg.read_text(encoding="utf-8")
    assert "bot_token" not in text
    assert "enabled: false" in text
    assert "enabled: true" not in text
