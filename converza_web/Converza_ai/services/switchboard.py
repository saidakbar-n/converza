from __future__ import annotations

import asyncio
import json
import re
from datetime import datetime, timezone
from typing import Any

from converza_agent.runtime import stream_copilot

from services.switchboard_repo import SwitchboardRepository
from services.workspace_data import build_routing_context

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
DEFAULT_ROUTE = "milo"


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


def build_system_prompt(
    *,
    agent_slug: str,
    brand_passport: dict[str, Any],
    memory: list[dict[str, Any]],
    workspace_snapshot: str,
) -> str:
    passport_json = json.dumps(brand_passport or {}, ensure_ascii=False, default=str, indent=2)
    memory_json = json.dumps(memory or [], ensure_ascii=False, default=str, indent=2)
    return (
        "You are operating inside Converza's autonomous revenue switchboard.\n"
        "Use the Brand Passport, your identity, and scoped memory only.\n"
        "Do not invent business facts, prices, results, or asset statuses.\n"
        "If another teammate should act, explicitly mention @Milo, @Sleyz, or @Vea.\n\n"
        f"AGENT IDENTITY\n{AGENT_IDENTITIES[agent_slug]}\n\n"
        f"BRAND PASSPORT\n{passport_json}\n\n"
        f"SCOPED MEMORY\n{memory_json}\n\n"
        f"{workspace_snapshot}"
    )


async def _complete_text(
    *,
    prompt: str,
    user_text: str,
    session_key: str,
) -> str:
    tokens: list[str] = []
    async for token in stream_copilot(
        [{"role": "user", "content": user_text}],
        system_prompt=prompt,
        session_key=session_key,
        max_tokens=1200,
        temperature=0.5,
    ):
        tokens.append(token)
    return "".join(tokens).strip()


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

    try:
        passport = repo.get_brand_passport(org_id)
        memory = repo.get_agent_memory(org_id, agent_slug, limit=10)
        workspace_snapshot = build_routing_context(org_id, agent_slug)
        prompt = build_system_prompt(
            agent_slug=agent_slug,
            brand_passport=passport,
            memory=memory,
            workspace_snapshot=workspace_snapshot,
        )
        response = await _complete_text(
            prompt=prompt,
            user_text=text,
            session_key=f"switchboard:{org_id}:{agent_slug}",
        )
        mentions = [m for m in extract_mentions(response) if m != agent_slug]
        repo.insert_agent_memory(org_id, agent_slug, "assistant", response)

        hitl_draft_id = None
        if response.lower().startswith("draft for approval:"):
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
        else:
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

        if mentions and depth < 1:
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
