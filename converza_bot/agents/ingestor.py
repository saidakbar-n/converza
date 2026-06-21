"""
Ingestor — entry point for every inbound Telegram update.

Responsibilities:
1. Extract sender identity and message text from the Telegram update.
2. Resolve the tenant org from the business_connection_id.
3. Upsert the prospect into Supabase (idempotent by external_id).
4. Ensure the prospect has a stable conversation_id (create on first contact).
5. Log the inbound message to the messages table.
6. Hand off to the Closer agent to generate a reply.
"""

import logging
import uuid

from models.schemas import TelegramUpdate, ProspectCreate, MessageCreate
from db.supabase_client import sb
from agents.closer import generate_reply
from services.closer_readiness import assess_closer_readiness, readiness_label
from services.org_resolver import resolve_org_id
from services.telegram_inbound import (
    extract_sender,
    is_outgoing_business_echo,
    raw_business_message,
    resolve_inbound_message,
)
from services.telegram_send import send_app_message, send_message

logger = logging.getLogger(__name__)

NON_TEXT_REPLY = (
    "Hozircha faqat matnli xabarlarga javob bera olamiz. "
    "Iltimos, savolingizni yozma shaklda yuboring."
)

# Avoid spamming owner on every customer message when setup is incomplete.
_owner_alert_at: dict[str, float] = {}
_OWNER_ALERT_COOLDOWN_SEC = 3600


async def _alert_owner_setup(org_id: str, label: str) -> None:
    import time

    key = f"{org_id}:{label}"
    now = time.time()
    if now - _owner_alert_at.get(key, 0) < _OWNER_ALERT_COOLDOWN_SEC:
        return
    _owner_alert_at[key] = now
    try:
        await send_app_message(
            int(org_id),
            f"⚠️ Mijoz xabariga javob berilmadi.\n\nSabab: {label}\n\n"
            "Tuzatish: @ConverzaApp_bot da /status ni tekshiring.",
        )
    except (TypeError, ValueError):
        pass


def _extract_business_connection_id(update: TelegramUpdate, raw: dict | None) -> str | None:
    raw = raw or update.model_dump(by_alias=True)
    business_message = raw_business_message(raw) or {}
    conn_id = business_message.get("business_connection_id")
    return str(conn_id) if conn_id else None


async def ingest_message(update: TelegramUpdate, raw: dict | None = None) -> None:
    raw = raw or update.model_dump(by_alias=True)
    msg, raw_msg, inbound_text, is_business = resolve_inbound_message(update, raw)
    if not msg or not raw_msg:
        return

    if is_business and is_outgoing_business_echo(raw_msg):
        logger.debug(
            "Skipping outgoing business echo update_id=%s message_id=%s",
            update.update_id,
            raw_msg.get("message_id"),
        )
        return

    sender = extract_sender(msg, raw_msg)
    if not sender or sender.is_bot:
        return

    business_connection_id = _extract_business_connection_id(update, raw)

    if not inbound_text:
        if is_business:
            logger.info(
                "Non-text business_message update_id=%s chat_id=%s keys=%s",
                update.update_id,
                msg.chat.id,
                sorted(raw_msg.keys()),
            )
            await send_message(
                msg.chat.id,
                NON_TEXT_REPLY,
                business_connection_id=business_connection_id,
            )
        return

    try:
        org_id = resolve_org_id(update)
    except ValueError as exc:
        logger.error("ingest_message org resolution failed: %s", exc)
        conn = (raw_business_message(raw) or {}).get("business_connection_id")
        logger.error(
            "business_connection_id=%s not linked to any org — "
            "owner should reconnect @ConverzaSales_bot in Telegram Business → Chatbots",
            conn,
        )
        return

    ready, reason = assess_closer_readiness(org_id)
    if not ready:
        label = readiness_label(reason)
        logger.warning(
            "DM Closer skipped for org_id=%s update_id=%s: %s",
            org_id,
            update.update_id,
            label,
        )
        await _alert_owner_setup(org_id, label)
        return

    # ── 1. Upsert prospect ──────────────────────────────────────────────────
    prospect_data = ProspectCreate(
        org_id=org_id,
        platform="telegram",
        external_id=str(sender.id),
        metadata={
            "first_name": sender.first_name,
            "username": sender.username,
            "language_code": sender.language_code,
        },
    )

    upsert_result = (
        sb.table("prospects")
        .upsert(
            prospect_data.model_dump(),
            on_conflict="org_id,platform,external_id",
        )
        .execute()
    )

    prospect_id: str | None = None
    conversation_id: str | None = None
    if upsert_result.data:
        prospect_id = upsert_result.data[0]["id"]
        conversation_id = upsert_result.data[0].get("conversation_id")

    # ── 2. Ensure conversation_id exists on the prospect ────────────────────
    if prospect_id and not conversation_id:
        conversation_id = str(uuid.uuid4())
        sb.table("prospects").update(
            {"conversation_id": conversation_id}
        ).eq("id", prospect_id).execute()

    # ── 3. Log inbound message ──────────────────────────────────────────────
    inbound = MessageCreate(
        org_id=org_id,
        prospect_id=prospect_id,
        direction="inbound",
        content=inbound_text,
        sent_by="system",
        conversation_id=conversation_id,
    )
    sb.table("messages").insert(inbound.model_dump()).execute()

    # ── 4. Hand off to closer ───────────────────────────────────────────────
    if prospect_id and conversation_id:
        try:
            await generate_reply(
                chat_id=msg.chat.id,
                prospect_id=prospect_id,
                inbound_text=inbound_text,
                org_id=org_id,
                conversation_id=conversation_id,
                business_connection_id=business_connection_id,
            )
        except Exception:
            logger.exception(
                "generate_reply failed org_id=%s prospect_id=%s update_id=%s",
                org_id,
                prospect_id,
                update.update_id,
            )
