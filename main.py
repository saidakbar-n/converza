import json
import asyncio
import os
from datetime import datetime, timezone
from typing import Any, AsyncGenerator

from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from db import get_supabase
from lib.context_assembler import VALID_AGENTS
from lib.repository import SupabaseRepository
from lib.switchboard import (
    handle_direct_agent_message,
    handle_squad_owner_message,
    resolve_hitl,
)

load_dotenv()

class AgentMessageRequest(BaseModel):
    org_id: str
    text: str


class SquadMessageRequest(BaseModel):
    org_id: str
    text: str


class HitlEditRequest(BaseModel):
    final_content: str | None = None


class OnboardingSaveRequest(BaseModel):
    owner_user_id: str
    org_id: str | None = None
    answers: dict[str, Any]


class OnboardingOwnerRequest(BaseModel):
    owner_user_id: str
    org_id: str | None = None


class AuthContext(BaseModel):
    user_id: str


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(title="Converza Co-Pilot", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_switchboard_repo() -> SupabaseRepository:
    return SupabaseRepository(get_supabase())


def get_default_org_id() -> str:
    return os.getenv("DEFAULT_ORG_ID") or os.getenv("NEXT_PUBLIC_DEFAULT_ORG_ID") or "00000000-0000-0000-0000-000000000001"


def get_backend_api_key() -> str:
    key = os.getenv("BACKEND_API_KEY")
    if not key:
        raise RuntimeError("BACKEND_API_KEY must be set in .env")
    return key


async def require_api_key(authorization: str | None = Header(None)) -> None:
    expected = f"Bearer {get_backend_api_key()}"
    if not authorization or authorization != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


def _normalize_bearer_token(token: str | None) -> str | None:
    if not token:
        return None
    token = token.strip()
    if token.lower().startswith("bearer "):
        return token[7:].strip()
    return token


def _get_user_id_from_supabase_token(token: str) -> str:
    result = get_supabase().auth.get_user(token)
    user = getattr(result, "user", None)
    user_id = getattr(user, "id", None)
    if not user_id:
        raise ValueError("Supabase session token did not resolve to a user")
    return str(user_id)


async def require_authenticated_user(
    authorization: str | None = Header(None),
    x_supabase_access_token: str | None = Header(None),
    access_token: str | None = Query(None),
) -> AuthContext:
    await require_api_key(authorization)
    token = _normalize_bearer_token(x_supabase_access_token) or _normalize_bearer_token(access_token)
    if not token:
        raise HTTPException(status_code=401, detail="Missing Supabase session")
    try:
        return AuthContext(user_id=_get_user_id_from_supabase_token(token))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Supabase session")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "service": "Converza Co-Pilot"}


def _fetch_brand_passport(brand_id: str) -> dict:
    """Fetch Brand Passport from Supabase by ID."""
    sb = get_supabase()
    result = sb.table("brand_passports").select("*").eq("id", brand_id).single().execute()
    return result.data


def _number_or_none(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _int_or_none(value: Any) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _is_missing_onboarding_migration(error: Exception) -> bool:
    message = str(error)
    return "brand_passports.owner_user_id" in message or "42703" in message


def _missing_schema_column(error: Exception) -> str | None:
    message = str(error)
    if "PGRST204" not in message and "Could not find the" not in message:
        return None
    marker = "Could not find the '"
    if marker not in message:
        return None
    return message.split(marker, 1)[1].split("'", 1)[0]


def _raise_onboarding_migration_error() -> None:
    raise HTTPException(
        status_code=503,
        detail="Onboarding database migration is pending. Run migrations/003_onboarding_paywall.sql in Supabase, then refresh.",
    )


def _get_passport_by_org(org_id: str) -> dict[str, Any] | None:
    result = (
        get_supabase()
        .table("brand_passports")
        .select("id,org_id,owner_user_id")
        .eq("org_id", org_id)
        .order("updated_at", desc=True)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def _assert_user_owns_org(user_id: str, org_id: str) -> None:
    try:
        passport = _get_passport_by_org(org_id)
    except Exception as e:
        if _is_missing_onboarding_migration(e):
            _raise_onboarding_migration_error()
        raise
    if not passport:
        raise HTTPException(status_code=403, detail="Org is not linked to this user")
    if str(passport.get("owner_user_id")) != user_id:
        raise HTTPException(status_code=403, detail="Org does not belong to this user")


def _assert_onboarding_owner(auth: AuthContext, owner_user_id: str) -> None:
    if owner_user_id != auth.user_id:
        raise HTTPException(status_code=403, detail="Cannot access onboarding for another user")


def _assert_org_not_owned_by_other(user_id: str, org_id: str) -> None:
    try:
        passport = _get_passport_by_org(org_id)
    except Exception as e:
        if _is_missing_onboarding_migration(e):
            _raise_onboarding_migration_error()
        raise
    if passport and str(passport.get("owner_user_id")) != user_id:
        raise HTTPException(status_code=403, detail="Org is already linked to another user")


def _onboarding_payload(owner_user_id: str, org_id: str, answers: dict[str, Any]) -> dict[str, Any]:
    tones = answers.get("brand_tone") or []
    colors = answers.get("brand_colors") or []
    channels = answers.get("channels_requested") or []
    tone_text = ", ".join(tones) if isinstance(tones, list) else (tones or "")
    notes_bits = []
    if answers.get("primary_pain_point"):
        notes_bits.append(f"Pain: {answers['primary_pain_point']}")
    if answers.get("primary_goal"):
        notes_bits.append(f"Goal: {answers['primary_goal']}")
    if answers.get("owner_contact"):
        notes_bits.append(f"Owner contact: {answers['owner_contact']}")
    if isinstance(channels, list) and channels:
        notes_bits.append(f"Channels: {', '.join(str(c) for c in channels)}")
    return {
        "owner_user_id": owner_user_id,
        "org_id": org_id,
        "onboarding_answers": answers,
        "brand_name": answers.get("business_name") or "Untitled brand",
        "industry": answers.get("industry"),
        "core_offer": answers.get("core_offer"),
        "target_audience": answers.get("ideal_customer"),
        "target_location": answers.get("customer_location"),
        "tone": tone_text or None,
        "hex_colors": colors if isinstance(colors, list) else [],
        "raw_notes": "\n".join(notes_bits),
        "current_marketing_handler": answers.get("current_marketing_handler"),
        "current_marketing_spend": _number_or_none(answers.get("current_marketing_spend")),
        "current_reply_handler": answers.get("current_reply_handler"),
        "weekly_message_volume": _int_or_none(answers.get("weekly_message_volume")),
        "primary_pain_point": answers.get("primary_pain_point"),
        "primary_goal": answers.get("primary_goal"),
        "channels_requested": channels if isinstance(channels, list) else [],
        "owner_name": answers.get("owner_name"),
        "owner_contact": answers.get("owner_contact"),
        "paywall_status": "pending",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def _sync_organization(org_id: str) -> None:
    """Create org row so brand_passports.org_id FK never fails on first Brand Vault save."""
    try:
        get_supabase().table("organizations").upsert({"id": org_id}).execute()
    except Exception:
        # Best-effort — some deployments allow inserts without org sync.
        pass


def _core_passport_fallback(payload: dict[str, Any]) -> dict[str, Any]:
    """Minimal Hermes-ready passport when extended onboarding columns are missing."""
    keep = {
        "org_id",
        "brand_name",
        "industry",
        "core_offer",
        "target_audience",
        "target_location",
        "tone",
        "raw_notes",
        "updated_at",
        "hex_colors",
    }
    slim = {k: v for k, v in payload.items() if k in keep and v is not None}
    # Preserve Brand Vault extras inside notes so closer/Hermes can still read them.
    import json as _json

    answers = payload.get("onboarding_answers") or {}
    meta = {
        "onboarding_answers": answers,
        "owner_user_id": payload.get("owner_user_id"),
        "paywall_status": payload.get("paywall_status") or "pending",
    }
    notes = (slim.get("raw_notes") or "").strip()
    block = (
        "---converza_onboarding---\n"
        f"{_json.dumps(meta, ensure_ascii=False)}\n"
        "---end_onboarding---"
    )
    slim["raw_notes"] = f"{block}\n{notes}".strip()
    slim["brand_name"] = slim.get("brand_name") or "Untitled brand"
    return slim


def _get_onboarding_passport(owner_user_id: str) -> dict[str, Any] | None:
    try:
        result = (
            get_supabase()
            .table("brand_passports")
            .select("*")
            .eq("owner_user_id", owner_user_id)
            .order("updated_at", desc=True)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None
    except Exception as e:
        if _is_missing_onboarding_migration(e):
            return None
        raise


def _save_onboarding_passport(owner_user_id: str, org_id: str, answers: dict[str, Any]) -> dict[str, Any]:
    sb = get_supabase()
    _sync_organization(org_id)
    existing = _get_onboarding_passport(owner_user_id)
    if not existing:
        # Also allow resume by org if owner_user_id column is new / unset.
        by_org = _get_passport_by_org(org_id)
        if by_org and (
            not by_org.get("owner_user_id")
            or str(by_org.get("owner_user_id")) == owner_user_id
        ):
            existing = (
                sb.table("brand_passports")
                .select("*")
                .eq("id", by_org["id"])
                .limit(1)
                .execute()
                .data
                or [None]
            )[0]

    payload = _onboarding_payload(owner_user_id, org_id, answers)

    def write(next_payload: dict[str, Any]):
        if existing:
            if "paywall_status" in next_payload:
                next_payload["paywall_status"] = existing.get("paywall_status") or "pending"
            return sb.table("brand_passports").update(next_payload).eq("id", existing["id"]).execute()
        return sb.table("brand_passports").insert(next_payload).execute()

    working = dict(payload)
    last_error: Exception | None = None
    for _ in range(24):
        try:
            result = write(working)
            return result.data[0]
        except Exception as e:
            last_error = e
            missing = _missing_schema_column(e)
            if missing and missing in working:
                working.pop(missing)
                continue
            # FK / org row race — retry after sync once more.
            if "organizations" in str(e).lower() or "23503" in str(e):
                _sync_organization(org_id)
                continue
            # Extended Brand Vault columns missing entirely → Hermes-safe core only.
            if "owner_user_id" in str(e) or "42703" in str(e) or "onboarding_" in str(e):
                working = _core_passport_fallback(payload)
                existing_core = None
                try:
                    rows = (
                        sb.table("brand_passports")
                        .select("*")
                        .eq("org_id", org_id)
                        .limit(1)
                        .execute()
                        .data
                        or []
                    )
                    existing_core = rows[0] if rows else None
                except Exception:
                    existing_core = None
                if existing_core:
                    result = (
                        sb.table("brand_passports")
                        .update(working)
                        .eq("id", existing_core["id"])
                        .execute()
                    )
                    return result.data[0]
                result = sb.table("brand_passports").insert(working).execute()
                return result.data[0]
            raise

    if last_error:
        raise last_error
    raise RuntimeError("Failed to save onboarding passport")


def _update_onboarding_status(owner_user_id: str, updates: dict[str, Any]) -> dict[str, Any]:
    existing = _get_onboarding_passport(owner_user_id)
    if not existing:
        raise KeyError(owner_user_id)
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    working = dict(updates)
    last_error: Exception | None = None
    for _ in range(8):
        try:
            result = (
                get_supabase()
                .table("brand_passports")
                .update(working)
                .eq("id", existing["id"])
                .execute()
            )
            return result.data[0]
        except Exception as e:
            last_error = e
            missing = _missing_schema_column(e)
            if missing and missing in working:
                working.pop(missing)
                continue
            # If completed_at column is missing, fold into raw_notes.
            if "onboarding_completed_at" in str(e) or "42703" in str(e):
                notes = (existing.get("raw_notes") or "") + "\n[onboarding_completed]"
                result = (
                    get_supabase()
                    .table("brand_passports")
                    .update({"raw_notes": notes.strip(), "updated_at": updates["updated_at"]})
                    .eq("id", existing["id"])
                    .execute()
                )
                return result.data[0]
            raise
    if last_error:
        raise last_error
    raise RuntimeError("Failed to update onboarding status")


# ---------------------------------------------------------------------------
# Agent Switchboard + Squad Chat
# ---------------------------------------------------------------------------

@app.get("/api/onboarding/state/{owner_user_id}")
async def onboarding_state(owner_user_id: str, auth: AuthContext = Depends(require_authenticated_user)):
    _assert_onboarding_owner(auth, owner_user_id)
    try:
        return {"passport": _get_onboarding_passport(owner_user_id)}
    except Exception as e:
        if _is_missing_onboarding_migration(e):
            _raise_onboarding_migration_error()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/onboarding/passport")
async def save_onboarding_passport(
    request: OnboardingSaveRequest,
    auth: AuthContext = Depends(require_authenticated_user),
):
    _assert_onboarding_owner(auth, request.owner_user_id)
    org_id = request.org_id or get_default_org_id()
    _assert_org_not_owned_by_other(auth.user_id, org_id)
    try:
        passport = _save_onboarding_passport(
            owner_user_id=request.owner_user_id,
            org_id=org_id,
            answers=request.answers,
        )
        return {"passport": passport}
    except Exception as e:
        if _is_missing_onboarding_migration(e):
            _raise_onboarding_migration_error()
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/onboarding/complete")
async def complete_onboarding(
    request: OnboardingOwnerRequest,
    auth: AuthContext = Depends(require_authenticated_user),
):
    _assert_onboarding_owner(auth, request.owner_user_id)
    if request.org_id:
        _assert_user_owns_org(auth.user_id, request.org_id)
    try:
        passport = _update_onboarding_status(
            request.owner_user_id,
            {"onboarding_completed_at": datetime.now(timezone.utc).isoformat()},
        )
        return {"passport": passport}
    except KeyError:
        raise HTTPException(status_code=404, detail="Onboarding passport not found")
    except Exception as e:
        if _is_missing_onboarding_migration(e):
            _raise_onboarding_migration_error()
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/onboarding/stub-payment")
async def complete_stub_payment(
    request: OnboardingOwnerRequest,
    auth: AuthContext = Depends(require_authenticated_user),
):
    _assert_onboarding_owner(auth, request.owner_user_id)
    if request.org_id:
        _assert_user_owns_org(auth.user_id, request.org_id)
    try:
        passport = _update_onboarding_status(
            request.owner_user_id,
            {"paywall_status": "stub_completed"},
        )
        return {"passport": passport}
    except KeyError:
        raise HTTPException(status_code=404, detail="Onboarding passport not found")
    except Exception as e:
        if _is_missing_onboarding_migration(e):
            _raise_onboarding_migration_error()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/agent/{agent_slug}/message")
async def agent_message(
    agent_slug: str,
    request: AgentMessageRequest,
    auth: AuthContext = Depends(require_authenticated_user),
):
    if agent_slug not in VALID_AGENTS:
        raise HTTPException(status_code=404, detail="Unknown agent")
    _assert_user_owns_org(auth.user_id, request.org_id)

    try:
        result = await handle_direct_agent_message(
            org_id=request.org_id,
            agent_slug=agent_slug,
            text=request.text,
            repo=get_switchboard_repo(),
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/squad/message")
async def squad_message(
    request: SquadMessageRequest,
    background_tasks: BackgroundTasks,
    auth: AuthContext = Depends(require_authenticated_user),
):
    _assert_user_owns_org(auth.user_id, request.org_id)
    return await handle_squad_owner_message(
        org_id=request.org_id,
        text=request.text,
        repo=get_switchboard_repo(),
        background_tasks=background_tasks,
    )


@app.get("/api/squad/stream")
async def squad_stream(org_id: str, auth: AuthContext = Depends(require_authenticated_user)):
    _assert_user_owns_org(auth.user_id, org_id)
    def fetch_stream_rows(
        table_name: str,
        last_created_at: str | None,
    ) -> list[dict]:
        query = (
            get_supabase()
            .table(table_name)
            .select("*")
            .eq("org_id", org_id)
        )
        if last_created_at:
            result = (
                query.gte("created_at", last_created_at)
                .order("created_at", desc=False)
                .limit(100)
                .execute()
            )
            return result.data or []

        result = (
            query.order("created_at", desc=True)
            .limit(100)
            .execute()
        )
        return list(reversed(result.data or []))

    async def events() -> AsyncGenerator[str, None]:
        seen_messages: set[str] = set()
        seen_steps: set[str] = set()
        last_message_created_at: str | None = None
        last_step_created_at: str | None = None
        while True:
            try:
                messages = fetch_stream_rows("squad_messages", last_message_created_at)
                for row in messages:
                    if row["id"] in seen_messages:
                        continue
                    seen_messages.add(row["id"])
                    last_message_created_at = row.get("created_at") or last_message_created_at
                    yield f"data: {json.dumps({'type': 'squad_message', 'row': row}, default=str)}\n\n"

                steps = fetch_stream_rows("agent_run_steps", last_step_created_at)
                for row in steps:
                    if row["id"] in seen_steps:
                        continue
                    seen_steps.add(row["id"])
                    last_step_created_at = row.get("created_at") or last_step_created_at
                    yield f"data: {json.dumps({'type': 'agent_run_step', 'row': row}, default=str)}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
            await asyncio.sleep(2)

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _get_draft_org_id(draft_id: str) -> str:
    draft = get_supabase().table("drafts").select("org_id").eq("id", draft_id).limit(1).execute()
    if not draft.data:
        raise KeyError(draft_id)
    return draft.data[0]["org_id"]


@app.post("/api/hitl/{draft_id}/approve")
async def hitl_approve(draft_id: str, auth: AuthContext = Depends(require_authenticated_user)):
    try:
        _assert_user_owns_org(auth.user_id, _get_draft_org_id(draft_id))
        return await resolve_hitl(
            draft_id=draft_id,
            action="approve",
            repo=get_switchboard_repo(),
        )
    except HTTPException:
        raise
    except KeyError:
        raise HTTPException(status_code=404, detail="Draft not found")


@app.post("/api/hitl/{draft_id}/reject")
async def hitl_reject(draft_id: str, auth: AuthContext = Depends(require_authenticated_user)):
    try:
        _assert_user_owns_org(auth.user_id, _get_draft_org_id(draft_id))
        return await resolve_hitl(
            draft_id=draft_id,
            action="reject",
            repo=get_switchboard_repo(),
        )
    except HTTPException:
        raise
    except KeyError:
        raise HTTPException(status_code=404, detail="Draft not found")


@app.post("/api/hitl/{draft_id}/edit")
async def hitl_edit(
    draft_id: str,
    request: HitlEditRequest,
    auth: AuthContext = Depends(require_authenticated_user),
):
    try:
        _assert_user_owns_org(auth.user_id, _get_draft_org_id(draft_id))
        return await resolve_hitl(
            draft_id=draft_id,
            action="edit",
            repo=get_switchboard_repo(),
            edited_content=request.final_content,
        )
    except HTTPException:
        raise
    except KeyError:
        raise HTTPException(status_code=404, detail="Draft not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/dashboard/{org_id}/stats")
async def dashboard_stats(org_id: str, auth: AuthContext = Depends(require_authenticated_user)):
    _assert_user_owns_org(auth.user_id, org_id)
    try:
        return {"stats": await get_switchboard_repo().get_dashboard_stats(org_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Brand Passport CRUD
# ---------------------------------------------------------------------------

@app.get("/api/brand-passport/{brand_id}")
async def get_brand_passport(brand_id: str, auth: AuthContext = Depends(require_authenticated_user)):
    try:
        passport = _fetch_brand_passport(brand_id)
        _assert_user_owns_org(auth.user_id, passport["org_id"])
        return passport
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/brand-passport")
async def create_brand_passport(passport: dict, auth: AuthContext = Depends(require_authenticated_user)):
    try:
        passport["owner_user_id"] = auth.user_id
        if passport.get("org_id"):
            _assert_org_not_owned_by_other(auth.user_id, passport["org_id"])
        sb = get_supabase()
        result = sb.table("brand_passports").insert(passport).execute()
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/brand-passport/{brand_id}")
async def update_brand_passport(
    brand_id: str,
    updates: dict,
    auth: AuthContext = Depends(require_authenticated_user),
):
    try:
        sb = get_supabase()
        passport = _fetch_brand_passport(brand_id)
        _assert_user_owns_org(auth.user_id, passport["org_id"])
        updates.pop("owner_user_id", None)
        updates.pop("org_id", None)
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        result = sb.table("brand_passports").update(updates).eq("id", brand_id).execute()
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


