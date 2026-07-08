from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any

from lib.context_assembler import assemble_context
from lib.engine import call_engine
from lib.mentions import extract_mentions
from lib.moneyprinter import call_moneyprinterturbo
from lib.narration import narrate_step
from lib.repository import SwitchboardRepository

DEFAULT_ROUTE = "milo"
MAX_HANDOFF_HOPS = 5


def summarize_hook_output(text: str) -> str | None:
    hook_lines = [
        line
        for line in text.splitlines()
        if re.match(r"^\s*(?:[-*]|\d+[\).:-])\s+", line)
    ]
    if not hook_lines:
        return None
    return f"{len(hook_lines)} drafted items"


def build_system_prompt(context: dict[str, Any]) -> str:
    brand_passport = json.dumps(
        context.get("brand_passport") or {},
        ensure_ascii=False,
        indent=2,
        default=str,
    )
    memory = json.dumps(
        context.get("memory") or [],
        ensure_ascii=False,
        indent=2,
        default=str,
    )
    return (
        "You are operating inside Converza's autonomous revenue switchboard.\n"
        "Use the Brand Passport, your identity, and scoped memory only. "
        "Do not invent facts about the business. If another agent should act, "
        "mention them explicitly as @Milo, @Sleyz, or @Vea.\n\n"
        "BRAND PASSPORT\n"
        f"{brand_passport}\n\n"
        "AGENT IDENTITY\n"
        f"{context.get('identity', '')}\n\n"
        "SCOPED MEMORY\n"
        f"{memory}"
    )


async def run_agent(
    *,
    org_id: str,
    agent_slug: str,
    text: str,
    triggered_by: str,
    repo: SwitchboardRepository,
    handoff_count: int = 0,
) -> dict[str, Any]:
    run_id = await repo.create_agent_run(org_id, agent_slug, triggered_by, text)

    try:
        async with narrate_step(
            repo=repo,
            org_id=org_id,
            agent_slug=agent_slug,
            run_id=run_id,
            step_label="Preparing agent context",
        ):
            await repo.insert_agent_memory(org_id, agent_slug, "user", text)
            if agent_slug == "milo":
                context = await assemble_context(org_id, "milo", repo=repo)
            elif agent_slug == "vea":
                context = await assemble_context(org_id, "vea", repo=repo)
            elif agent_slug == "sleyz":
                context = await assemble_context(org_id, "sleyz", repo=repo)
            else:
                raise ValueError(f"Unknown agent_slug: {agent_slug}")

        if agent_slug == "milo":
            response = await _run_milo(org_id, run_id, text, repo, context)
        elif agent_slug == "vea":
            response = await _run_vea(org_id, run_id, text, repo, context)
        else:
            response = await _run_sleyz(org_id, run_id, text, repo, context)

        mentions: list[str] = []
        if response:
            await repo.insert_agent_memory(org_id, agent_slug, "assistant", response)
            mentions = extract_mentions(response)
            await repo.insert_squad_message(
                org_id=org_id,
                sender_slug=agent_slug,
                content=response,
                mentions=mentions,
                related_run_id=run_id,
            )
        if not (agent_slug == "vea" and not response):
            await repo.update_agent_run(
                run_id,
                {
                    "status": "completed",
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                },
            )

        if mentions and handoff_count >= MAX_HANDOFF_HOPS:
            await repo.insert_squad_message(
                org_id=org_id,
                sender_slug="converza",
                content=(
                    f"Agent handoff chain halted after {MAX_HANDOFF_HOPS} hops for cost safety. "
                    f"Last agent {agent_slug} mentioned: {', '.join('@' + agent for agent in mentions)}."
                ),
                mentions=[],
                related_run_id=run_id,
            )
            return {"run_id": run_id, "agent_slug": agent_slug, "response": response}

        for mentioned_agent in mentions:
            await run_agent(
                org_id=org_id,
                agent_slug=mentioned_agent,
                text=response,
                triggered_by="agent",
                repo=repo,
                handoff_count=handoff_count + 1,
            )

        return {"run_id": run_id, "agent_slug": agent_slug, "response": response}
    except Exception:
        await repo.update_agent_run(
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
    background_tasks: Any | None = None,
) -> dict[str, Any]:
    mentions = extract_mentions(text)
    owner_message = await repo.insert_squad_message(
        org_id=org_id,
        sender_slug="owner",
        content=text,
        mentions=mentions,
    )

    targets = mentions or [DEFAULT_ROUTE]
    results = []
    for agent_slug in targets:
        kwargs = {
            "org_id": org_id,
            "agent_slug": agent_slug,
            "text": text,
            "triggered_by": "owner",
            "repo": repo,
        }
        if background_tasks is not None:
            background_tasks.add_task(run_agent, **kwargs)
        else:
            results.append(
                await run_agent(
                    **kwargs,
                )
            )
    return {"message": owner_message, "routed_to": targets, "runs": results}


async def handle_direct_agent_message(
    *,
    org_id: str,
    agent_slug: str,
    text: str,
    repo: SwitchboardRepository,
) -> dict[str, Any]:
    return await run_agent(
        org_id=org_id,
        agent_slug=agent_slug,
        text=text,
        triggered_by="owner",
        repo=repo,
    )


async def _run_milo(
    org_id: str,
    run_id: str,
    text: str,
    repo: SwitchboardRepository,
    context: dict[str, Any],
) -> str:
    async with narrate_step(
        repo=repo,
        org_id=org_id,
        agent_slug="milo",
        run_id=run_id,
        step_label="Reviewing brand and request",
    ):
        pass

    await repo.insert_agent_run_step(
        agent_run_id=run_id,
        org_id=org_id,
        agent_slug="milo",
        step_label="Drafting hooks",
        step_status="started",
    )
    await repo.insert_squad_message(
        org_id=org_id,
        sender_slug="milo",
        content="Starting drafting hooks...",
        related_run_id=run_id,
    )
    response = await call_engine(
        build_system_prompt(context),
        (
            "Create the marketing output requested by the owner. "
            "If the request needs a video asset, include a concise @Vea handoff "
            "with the best hook or script Vea should render.\n\n"
            f"OWNER REQUEST:\n{text}"
        ),
    )
    completed_detail = summarize_hook_output(response)
    await repo.insert_agent_run_step(
        agent_run_id=run_id,
        org_id=org_id,
        agent_slug="milo",
        step_label="Drafting hooks",
        step_status="completed",
        detail=completed_detail,
    )
    await repo.insert_squad_message(
        org_id=org_id,
        sender_slug="milo",
        content=(
            f"Finished drafting hooks - {completed_detail}"
            if completed_detail
            else "Finished drafting hooks."
        ),
        related_run_id=run_id,
    )
    return response


async def _run_vea(
    org_id: str,
    run_id: str,
    text: str,
    repo: SwitchboardRepository,
    context: dict[str, Any],
) -> str:
    async with narrate_step(
        repo=repo,
        org_id=org_id,
        agent_slug="vea",
        run_id=run_id,
        step_label="Drafting video script",
    ):
        script = await call_engine(
            build_system_prompt(context),
            (
                "Write a concise 15-second vertical video script for the requested ad. "
                "Return only the spoken script, no markdown, no scene labels.\n\n"
                f"REQUEST:\n{text}"
            ),
        )
        if not script.strip():
            script = await call_engine(
                build_system_prompt(context),
                (
                    "Return exactly one short spoken ad script sentence. "
                    "Do not return analysis, labels, or markdown.\n\n"
                    f"REQUEST:\n{text}"
                ),
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

    draft = await repo.create_draft(
        org_id=org_id,
        agent_slug="vea",
        inbound_text=text,
        draft_content=(
            "15s campaign video ready for review.\n\n"
            f"Script: {script}\n\n"
            f"Preview URL: {video_url}"
        ),
        prospect_id=None,
    )
    await repo.update_agent_run(run_id, {"status": "awaiting_hitl"})
    await repo.insert_squad_message(
        org_id=org_id,
        sender_slug="vea",
        content=f"Video's ready for approval: {video_url}",
        mentions=[],
        related_run_id=run_id,
        hitl_draft_id=draft["id"],
    )
    return ""


async def _run_sleyz(
    org_id: str,
    run_id: str,
    text: str,
    repo: SwitchboardRepository,
    context: dict[str, Any],
) -> str:
    async with narrate_step(
        repo=repo,
        org_id=org_id,
        agent_slug="sleyz",
        run_id=run_id,
        step_label="Reviewing sales context",
        completed_detail="lead status summarized",
    ):
        return await call_engine(
            build_system_prompt(context),
            (
                "Act as Sleyz, the sales conversation owner. Produce a practical sales reply or owner recommendation. "
                "If drafting a customer-facing message, label it 'Draft for approval' and keep it short, warm, and DM-native. "
                "Do not sign the message. Do not invent brand facts, discounts, guarantees, sender names, or company names. "
                "For pricing objections, acknowledge the concern, anchor the business value, ask one qualifying question, "
                "and offer a low-risk pilot or next call only if the owner requested it.\n\n"
                f"REQUEST:\n{text}"
            ),
        )


async def resolve_hitl(
    *,
    draft_id: str,
    action: str,
    repo: SwitchboardRepository,
    edited_content: str | None = None,
) -> dict[str, Any]:
    draft = await repo.get_draft(draft_id)
    if not draft:
        raise KeyError(draft_id)

    status_map = {
        "approve": "approved",
        "reject": "rejected",
        "edit": "edited",
    }
    status = status_map[action]
    if action == "edit":
        final_content = (edited_content or "").strip()
        if not final_content:
            raise ValueError("final_content is required when editing a draft")
    else:
        final_content = draft.get("draft_content")

    updated = await repo.update_draft(
        draft_id,
        {
            "status": status,
            "final_content": final_content,
            "decided_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    run_id = await repo.get_run_id_for_draft(draft_id)
    if run_id:
        run_status = "failed" if action == "reject" else "completed"
        await repo.update_agent_run(
            run_id,
            {
                "status": run_status,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            },
        )
    await repo.insert_squad_message(
        org_id=draft["org_id"],
        sender_slug="converza",
        content=f"HITL {status}: {draft.get('agent_slug', 'agent')} draft {draft_id}",
        mentions=[],
        related_run_id=run_id,
        hitl_draft_id=draft_id,
    )
    return updated
