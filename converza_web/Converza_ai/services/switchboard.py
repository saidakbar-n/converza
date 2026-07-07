from __future__ import annotations

import asyncio
import json
import re
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, AsyncGenerator

from converza_agent.groq_client import groq_complete_text, groq_configured, groq_stream
from converza_agent.runtime import stream_copilot

from services.agent_settings import resolve_agent_model
from services.moneyprinter import call_moneyprinterturbo, moneyprinter_configured
from services.switchboard_repo import SwitchboardRepository
from services.workspace_data import (
    build_routing_context,
    fetch_competitors,
    fetch_milo_insights,
    fetch_pipeline,
)

AGENT_IDENTITIES = {
    "milo": (
        "ROLE: Marketing strategist and campaign lead.\n"
        "SCOPE: Owns market research, campaign angles, hooks, creative briefs, "
        "content calendars, and delegation to Vea when video assets are needed.\n"
        "NEVER: Never publishes externally, spends budget, invents performance "
        "data, or claims a video has rendered before Vea confirms it.\n"
        "TONE: Confident, trend-aware, strategic, plain-spoken.\n"
        "ESCALATES WHEN: Tag @Vea when a hook needs video execution, tag @Sleyz "
        "when lead or sales follow-up context is required, and request HITL before "
        "anything publishes or spends."
    ),
    "sleyz": (
        "ROLE: Sales closer and revenue conversation owner.\n"
        "SCOPE: Owns inbound lead qualification, objection handling, follow-ups, "
        "payment nudges, handoff-ready sales summaries, and support-adjacent "
        "revenue recovery.\n"
        "NEVER: Never promises discounts, refunds, delivery dates, medical outcomes, "
        "or sends a customer-facing message without HITL approval.\n"
        "TONE: Direct, warm, concise, closer energy without pressure.\n"
        "ESCALATES WHEN: Request HITL before sending any customer message, tag "
        "@Milo when the objection reveals a marketing-message gap, and tag @Vea "
        "when a lead asks for proof or product video assets.\n\n"
        "Reply rules:\n"
        "- If this is owner guidance, start with 'Owner note:'.\n"
        "- If this is customer-facing copy, start with 'Draft for approval:'.\n"
        "- Keep customer-facing drafts under 120 words unless asked otherwise.\n"
        "- Do not sign with a fake person or company."
    ),
    "vea": (
        "ROLE: Video production specialist.\n"
        "SCOPE: Owns scripts, cuts, render plans, captions, variants, and video "
        "approval drafts.\n"
        "NEVER: Never publishes, sends, or spends money. Never claims a final asset "
        "is live before owner approval.\n"
        "TONE: Concise, technical, craft-focused.\n"
        "ESCALATES WHEN: Request HITL before publishing or sending assets, tag "
        "@Milo when a hook or campaign angle is missing, and tag @Sleyz when sales "
        "proof is needed.\n\n"
        "Reply rules:\n"
        "- If output is a customer/public-facing asset, start with 'Draft for approval:'.\n"
        "- Otherwise start with 'Owner note:'."
    ),
}

VALID_AGENTS = tuple(AGENT_IDENTITIES.keys())
MENTION_RE = re.compile(r"@(?P<agent>Milo|Sleyz|Vea)\b", re.I)
RENDER_RE = re.compile(
    r"\b(render|produce (a )?video|make (a )?video|video ready|create (a )?reel|"
    r"shoot (a )?video|generate (a )?video)\b",
    re.I,
)
DEFAULT_ROUTE = "milo"
MAX_CHAIN_DEPTH = 2


def extract_mentions(text: str) -> list[str]:
    seen: list[str] = []
    for match in MENTION_RE.finditer(text or ""):
        agent = match.group("agent").lower()
        if agent not in seen:
            seen.append(agent)
    return seen


def route_owner_message(text: str) -> str:
    mentions = extract_mentions(text)
    return mentions[0] if mentions else DEFAULT_ROUTE


def wants_video_render(text: str) -> bool:
    return bool(RENDER_RE.search(text or ""))


def _trim_memory(memory: list[dict[str, Any]], *, max_chars: int = 2500) -> list[dict[str, Any]]:
    trimmed: list[dict[str, Any]] = []
    used = 0
    for row in reversed(memory):
        content = str(row.get("content") or "")
        if not content:
            continue
        if used + len(content) > max_chars and trimmed:
            break
        trimmed.insert(0, row)
        used += len(content)
    return trimmed


def build_system_prompt(
    *,
    agent_slug: str,
    brand_passport: dict[str, Any],
    pinned_memory: list[dict[str, Any]],
    conversation_memory: list[dict[str, Any]],
    workspace_snapshot: str,
) -> str:
    passport_json = json.dumps(brand_passport or {}, ensure_ascii=False, default=str)[:3500]
    pinned_json = json.dumps(
        _trim_memory(pinned_memory, max_chars=1800),
        ensure_ascii=False,
        default=str,
    )
    memory_json = json.dumps(
        _trim_memory(conversation_memory, max_chars=1800),
        ensure_ascii=False,
        default=str,
    )
    return (
        "You are operating inside Converza's autonomous revenue switchboard.\n"
        "Use the Brand Passport, your identity, and scoped memory only.\n"
        "Do not invent business facts, prices, results, or asset statuses.\n"
        "If another teammate should act, explicitly mention @Milo, @Sleyz, or @Vea.\n\n"
        f"AGENT IDENTITY\n{AGENT_IDENTITIES[agent_slug]}\n\n"
        f"BRAND PASSPORT\n{passport_json}\n\n"
        f"PINNED MEMORY (owner-curated — highest priority)\n{pinned_json}\n\n"
        f"RECENT THREAD\n{memory_json}\n\n"
        f"{workspace_snapshot}"
    )


async def _complete_text(
    *,
    prompt: str,
    user_text: str,
    session_key: str,
    model_cfg: dict[str, Any],
) -> str:
    messages = [{"role": "user", "content": user_text}]
    if groq_configured():
        return await groq_complete_text(
            prompt,
            user_text,
            model=model_cfg.get("groq_model"),
            max_tokens=int(model_cfg.get("max_tokens") or 1200),
            temperature=float(model_cfg.get("temperature") or 0.5),
        )

    tokens: list[str] = []
    async for token in stream_copilot(
        messages,
        system_prompt=prompt,
        session_key=session_key,
        max_tokens=int(model_cfg.get("max_tokens") or 1200),
        temperature=float(model_cfg.get("temperature") or 0.5),
    ):
        tokens.append(token)
    return "".join(tokens).strip()


async def stream_agent_completion(
    *,
    prompt: str,
    user_text: str,
    session_key: str,
    model_cfg: dict[str, Any],
) -> AsyncGenerator[str, None]:
    messages = [{"role": "user", "content": user_text}]
    if groq_configured():
        async for token in groq_stream(
            prompt,
            messages,
            model=model_cfg.get("groq_model"),
            max_tokens=int(model_cfg.get("max_tokens") or 1200),
            temperature=float(model_cfg.get("temperature") or 0.5),
        ):
            yield token
        return

    async for token in stream_copilot(
        messages,
        system_prompt=prompt,
        session_key=session_key,
        max_tokens=int(model_cfg.get("max_tokens") or 1200),
        temperature=float(model_cfg.get("temperature") or 0.5),
    ):
        yield token


@asynccontextmanager
async def narrate_step(
    *,
    repo: SwitchboardRepository,
    org_id: str,
    agent_slug: str,
    run_id: str,
    step_label: str,
    completed_detail: str,
):
    repo.insert_agent_run_step(run_id, org_id, agent_slug, step_label, "started")
    try:
        yield
        repo.insert_agent_run_step(
            run_id,
            org_id,
            agent_slug,
            step_label,
            "completed",
            detail=completed_detail,
        )
    except Exception:
        repo.insert_agent_run_step(
            run_id,
            org_id,
            agent_slug,
            step_label,
            "failed",
        )
        raise


def assemble_agent_context(repo: SwitchboardRepository, org_id: str, agent_slug: str) -> tuple[str, dict[str, Any]]:
    passport = repo.get_brand_passport(org_id)
    org_models = repo.get_org_model_settings(org_id)
    model_cfg = resolve_agent_model(agent_slug, org_models)
    pinned = repo.get_agent_memory(org_id, agent_slug, limit=12, pinned_only=True)
    if not pinned:
        pinned = repo.list_pinned_memory(org_id, limit=12)
    conversation = repo.get_agent_memory(org_id, agent_slug, limit=8)
    workspace_snapshot = build_routing_context(org_id, agent_slug)
    prompt = build_system_prompt(
        agent_slug=agent_slug,
        brand_passport=passport,
        pinned_memory=pinned,
        conversation_memory=conversation,
        workspace_snapshot=workspace_snapshot,
    )
    return prompt, model_cfg


async def _run_milo(
    *,
    org_id: str,
    run_id: str,
    text: str,
    repo: SwitchboardRepository,
    model_cfg: dict[str, Any],
    prompt: str,
) -> str:
    insights = fetch_milo_insights(org_id)
    competitors = fetch_competitors(org_id)
    trend = (insights.get("demand_signals") or [{}])[0].get("trend", "market signals loaded")
    competitor_count = len(competitors.get("competitors") or [])

    async with narrate_step(
        repo=repo,
        org_id=org_id,
        agent_slug="milo",
        run_id=run_id,
        step_label="Researching market trends",
        completed_detail=str(trend)[:120],
    ):
        pass

    async with narrate_step(
        repo=repo,
        org_id=org_id,
        agent_slug="milo",
        run_id=run_id,
        step_label="Drafting hooks",
        completed_detail=f"{competitor_count} competitors in context",
    ):
        return await _complete_text(
            prompt=prompt,
            user_text=(
                "Create the marketing output requested by the owner. "
                "If the request needs a video asset, include a concise @Vea handoff "
                "with the best hook or script Vea should render.\n\n"
                f"OWNER REQUEST:\n{text}"
            ),
            session_key=f"switchboard:{org_id}:milo",
            model_cfg=model_cfg,
        )


async def _run_sleyz(
    *,
    org_id: str,
    run_id: str,
    text: str,
    repo: SwitchboardRepository,
    model_cfg: dict[str, Any],
    prompt: str,
) -> str:
    pipeline = fetch_pipeline(org_id)
    leads = pipeline.get("leads") or []
    hot = sum(1 for lead in leads if str(lead.get("condition") or "") in ("purchasing", "warm", "closed"))

    async with narrate_step(
        repo=repo,
        org_id=org_id,
        agent_slug="sleyz",
        run_id=run_id,
        step_label="Reviewing sales context",
        completed_detail=f"{hot} warm leads in pipeline",
    ):
        return await _complete_text(
            prompt=prompt,
            user_text=(
                "Act as Sleyz, the sales conversation owner. Produce a practical sales reply "
                "or owner recommendation. If drafting a customer-facing message, start with "
                "'Draft for approval:' and keep it short, warm, and DM-native.\n\n"
                f"REQUEST:\n{text}"
            ),
            session_key=f"switchboard:{org_id}:sleyz",
            model_cfg=model_cfg,
        )


async def _run_vea(
    *,
    org_id: str,
    run_id: str,
    text: str,
    repo: SwitchboardRepository,
    model_cfg: dict[str, Any],
    prompt: str,
) -> tuple[str, str | None]:
    if not wants_video_render(text):
        response = await _complete_text(
            prompt=prompt,
            user_text=(
                "Produce scripts, render plans, captions, or variants for the owner request. "
                "If they want an actual render, tell them to say 'render this video'.\n\n"
                f"REQUEST:\n{text}"
            ),
            session_key=f"switchboard:{org_id}:vea",
            model_cfg=model_cfg,
        )
        return response, None

    if not moneyprinter_configured():
        response = await _complete_text(
            prompt=prompt,
            user_text=(
                "Write a concise 15-second vertical video script for the requested ad. "
                "Return only the spoken script.\n\n"
                f"REQUEST:\n{text}"
            ),
            session_key=f"switchboard:{org_id}:vea",
            model_cfg=model_cfg,
        )
        note = (
            "Owner note: Render worker is offline. Script is ready — connect "
            "MONEYPRINTERTURBO_BASE_URL to auto-render."
        )
        return f"{note}\n\nScript:\n{response}", None

    script = await _complete_text(
        prompt=prompt,
        user_text=(
            "Write a concise 15-second vertical video script for the requested ad. "
            "Return only the spoken script, no markdown, no scene labels.\n\n"
            f"REQUEST:\n{text}"
        ),
        session_key=f"switchboard:{org_id}:vea",
        model_cfg=model_cfg,
    )
    if not script.strip():
        raise RuntimeError("Vea script generation returned empty content")

    async with narrate_step(
        repo=repo,
        org_id=org_id,
        agent_slug="vea",
        run_id=run_id,
        step_label="Rendering video",
        completed_detail="video URL ready",
    ):
        render_result = await call_moneyprinterturbo(
            script=script,
            video_subject="Converza campaign ad",
        )

    video_url = render_result["video_url"]
    draft = repo.create_draft(
        org_id=org_id,
        agent_slug="vea",
        inbound_text=text,
        draft_content=(
            "15s campaign video ready for review.\n\n"
            f"Script: {script}\n\n"
            f"Preview URL: {video_url}"
        ),
    )
    hitl_draft_id = str(draft.get("id") or "")
    repo.update_agent_run(
        run_id,
        {
            "status": "awaiting_hitl",
            "completed_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    repo.insert_squad_message(
        org_id=org_id,
        sender_slug="vea",
        content=f"Video's ready for approval: {video_url}",
        mentions=[],
        related_run_id=run_id,
        hitl_draft_id=hitl_draft_id,
    )
    return "", hitl_draft_id


async def run_agent(
    *,
    org_id: str,
    agent_slug: str,
    text: str,
    triggered_by: str,
    repo: SwitchboardRepository,
    depth: int = 0,
) -> dict[str, Any]:
    if agent_slug not in VALID_AGENTS:
        raise ValueError(f"Unknown agent slug: {agent_slug}")

    run_id = repo.create_agent_run(org_id, agent_slug, triggered_by, text)
    repo.insert_agent_memory(org_id, agent_slug, "user", text)
    repo.insert_agent_run_step(
        run_id,
        org_id,
        agent_slug,
        "Analyzing request",
        "started",
    )

    response = ""
    mentions: list[str] = []
    hitl_draft_id = None

    try:
        prompt, model_cfg = assemble_agent_context(repo, org_id, agent_slug)

        if agent_slug == "milo":
            response = await _run_milo(
                org_id=org_id,
                run_id=run_id,
                text=text,
                repo=repo,
                model_cfg=model_cfg,
                prompt=prompt,
            )
        elif agent_slug == "sleyz":
            response = await _run_sleyz(
                org_id=org_id,
                run_id=run_id,
                text=text,
                repo=repo,
                model_cfg=model_cfg,
                prompt=prompt,
            )
        elif agent_slug == "vea":
            response, hitl_draft_id = await _run_vea(
                org_id=org_id,
                run_id=run_id,
                text=text,
                repo=repo,
                model_cfg=model_cfg,
                prompt=prompt,
            )
        else:
            response = await _complete_text(
                prompt=prompt,
                user_text=text,
                session_key=f"switchboard:{org_id}:{agent_slug}",
                model_cfg=model_cfg,
            )

        mentions: list[str] = []
        if response:
            mentions = [m for m in extract_mentions(response) if m != agent_slug]
            repo.insert_agent_memory(org_id, agent_slug, "assistant", response)

            if not hitl_draft_id and response.lower().startswith("draft for approval:"):
                draft = repo.create_draft(
                    org_id=org_id,
                    agent_slug=agent_slug,
                    inbound_text=text,
                    draft_content=response.split(":", 1)[1].strip() or response,
                )
                hitl_draft_id = str(draft.get("id") or "")
                repo.update_agent_run(
                    run_id,
                    {
                        "status": "awaiting_hitl",
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                    },
                )
            elif not hitl_draft_id:
                repo.update_agent_run(
                    run_id,
                    {
                        "status": "completed",
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                    },
                )

            repo.insert_agent_run_step(
                run_id,
                org_id,
                agent_slug,
                "Delivered response",
                "completed",
                detail="Awaiting approval" if hitl_draft_id else "Posted to squad",
            )
            repo.insert_squad_message(
                org_id=org_id,
                sender_slug=agent_slug,
                content=response,
                mentions=mentions,
                related_run_id=run_id,
                hitl_draft_id=hitl_draft_id,
            )

        if mentions and depth < MAX_CHAIN_DEPTH:
            await asyncio.gather(
                *[
                    run_agent(
                        org_id=org_id,
                        agent_slug=mention,
                        text=response,
                        triggered_by="agent",
                        repo=repo,
                        depth=depth + 1,
                    )
                    for mention in mentions
                ]
            )

        return {
            "run_id": run_id,
            "agent_slug": agent_slug,
            "response": response,
            "hitl_draft_id": hitl_draft_id,
            "mentions": mentions,
        }
    except Exception:
        repo.insert_agent_run_step(
            run_id,
            org_id,
            agent_slug,
            "Failed to complete request",
            "failed",
        )
        repo.update_agent_run(
            run_id,
            {
                "status": "failed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        raise


async def handle_squad_owner_message(
    *,
    org_id: str,
    text: str,
    repo: SwitchboardRepository,
) -> dict[str, Any]:
    mentions = extract_mentions(text)
    owner_message = repo.insert_squad_message(
        org_id=org_id,
        sender_slug="owner",
        content=text,
        mentions=mentions,
    )
    targets = mentions or [route_owner_message(text)]
    return {"message": owner_message, "routed_to": targets}


async def resolve_hitl(
    *,
    draft_id: str,
    action: str,
    repo: SwitchboardRepository,
    edited_content: str | None = None,
) -> dict[str, Any]:
    draft = repo.get_draft(draft_id)
    if not draft:
        raise KeyError(draft_id)

    status_map = {"approve": "approved", "reject": "rejected", "edit": "edited"}
    status = status_map[action]
    payload: dict[str, Any] = {
        "status": status,
        "decided_at": datetime.now(timezone.utc).isoformat(),
    }
    if action == "edit" and edited_content:
        payload["final_content"] = edited_content

    updated = repo.update_draft(draft_id, payload)
    repo.insert_squad_message(
        org_id=str(draft["org_id"]),
        sender_slug="converza",
        content=f"HITL {status}: {draft.get('agent_slug', 'agent')} draft resolved",
        mentions=[],
        hitl_draft_id=draft_id,
    )
    return updated
