from contextlib import asynccontextmanager
import asyncio
import logging
import os

import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI

from agents.auditor import run_nightly_audit
from routers import webhooks, web_api
from services.config import admin_telegram_ids, is_production, require_env_vars
from services.telegram_bots import (
    APP_BOT_TOKEN,
    SALES_BOT_TOKEN,
    app_api_base,
    sales_api_base,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

APP_COMMANDS = [
    {"command": "start", "description": "Converza onboarding"},
    {"command": "help", "description": "Yordam"},
    {"command": "status", "description": "Obuna va sozlama holati"},
    {"command": "profile", "description": "Brend pasporti"},
    {"command": "subscribe", "description": "Oylik obuna to'lovi"},
    {"command": "report", "description": "Kunlik hisobot"},
    {"command": "fill", "description": "Pasportni to'ldirish"},
]

APP_ADMIN_COMMANDS = APP_COMMANDS + [
    {"command": "admin", "description": "Admin panel"},
    {"command": "pending", "description": "Kutilayotgan arizalar"},
    {"command": "approve", "description": "Arizani tasdiqlash"},
    {"command": "reject", "description": "Arizani rad etish"},
]

# Sales bot: owner /config + redirect for everyone else.
SALES_COMMANDS = [
    {"command": "config", "description": "DM Closer ohangini tanlash"},
    {"command": "start", "description": "Bu bot haqida"},
    {"command": "help", "description": "Yordam"},
]


async def _delete_commands(api_base: str) -> None:
    """Remove all slash commands for default scope and per-admin chat scopes."""
    if not api_base:
        return
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(f"{api_base}/deleteMyCommands", json={})
            for admin_id in admin_telegram_ids():
                try:
                    await client.post(
                        f"{api_base}/deleteMyCommands",
                        json={"scope": {"type": "chat", "chat_id": int(admin_id)}},
                    )
                except Exception as exc:
                    logger.warning(
                        "Failed to delete scoped commands for %s on %s: %s",
                        admin_id,
                        api_base,
                        exc,
                    )
    except Exception as exc:
        logger.warning("Failed to delete bot commands on %s: %s", api_base, exc)


async def _set_commands(api_base: str, commands: list, admin_commands: list | None = None) -> None:
    if not api_base:
        return
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(f"{api_base}/setMyCommands", json={"commands": commands})
            if admin_commands:
                for admin_id in admin_telegram_ids():
                    try:
                        await client.post(
                            f"{api_base}/setMyCommands",
                            json={
                                "commands": admin_commands,
                                "scope": {"type": "chat", "chat_id": int(admin_id)},
                            },
                        )
                    except Exception as exc:
                        logger.warning("Failed admin commands for %s: %s", admin_id, exc)
    except Exception as exc:
        logger.warning("Failed to set bot commands on %s: %s", api_base, exc)


async def set_bot_commands() -> None:
    app = app_api_base()
    sales = sales_api_base()
    if sales and sales == app:
        logger.warning(
            "TELEGRAM_BOT_TOKEN equals TELEGRAM_APP_BOT_TOKEN — use separate bots"
        )
    if app:
        await _delete_commands(app)
        await _set_commands(app, APP_COMMANDS, APP_ADMIN_COMMANDS)
    if sales and sales != app:
        await _delete_commands(sales)
        await _set_commands(sales, SALES_COMMANDS, None)


# Hermes gateway may register its agent menu async after startup — re-apply Converza menus.
_COMMAND_REFRESH_DELAYS_SEC = (15, 45, 120, 300, 600)


async def _refresh_bot_commands_delayed() -> None:
    app = app_api_base()
    sales = sales_api_base()
    for delay in _COMMAND_REFRESH_DELAYS_SEC:
        await asyncio.sleep(delay)
        if app:
            await _delete_commands(app)
            await _set_commands(app, APP_COMMANDS, APP_ADMIN_COMMANDS)
        if sales and sales != app:
            await _delete_commands(sales)
            await _set_commands(sales, SALES_COMMANDS, None)
        logger.info(
            "Re-applied bot command menus after %ss (override Hermes menu)", delay
        )


def _validate_startup() -> None:
    require_env_vars(
        [
            "SUPABASE_URL",
            "SUPABASE_SERVICE_KEY",
            "HERMES_API_KEY",
            "TELEGRAM_BOT_TOKEN",
            "TELEGRAM_APP_BOT_TOKEN",
            "WEB_APP_URL",
        ],
        service="bot",
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    _validate_startup()
    await set_bot_commands()
    asyncio.create_task(_refresh_bot_commands_delayed())

    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        set_bot_commands,
        CronTrigger(minute="*/30", timezone="Asia/Tashkent"),
        id="refresh_bot_commands",
        replace_existing=True,
    )
    trigger = CronTrigger(hour=23, minute=59, timezone="Asia/Tashkent")
    scheduler.add_job(run_nightly_audit, trigger)
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="Converza Telegram Bot", version="0.2.0", lifespan=lifespan)

app.include_router(webhooks.router)
app.include_router(web_api.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "converza_bot"}


@app.get("/ready")
async def ready():
    checks: dict[str, str] = {}
    ok = True

    for key, val in (
        ("SUPABASE_URL", os.getenv("SUPABASE_URL", "")),
        ("HERMES_API_KEY", os.getenv("HERMES_API_KEY", "")),
        ("TELEGRAM_BOT_TOKEN", SALES_BOT_TOKEN),
        ("TELEGRAM_APP_BOT_TOKEN", APP_BOT_TOKEN),
    ):
        if val.strip():
            checks[key] = "ok"
        else:
            checks[key] = "missing"
            ok = False

    try:
        from db.supabase_client import sb
        sb.table("organizations").select("id").limit(1).execute()
        checks["supabase"] = "ok"
    except Exception as exc:
        checks["supabase"] = f"error: {exc}"
        ok = False

    if not ok:
        return {"status": "not_ready", "checks": checks}
    return {"status": "ready", "checks": checks}
