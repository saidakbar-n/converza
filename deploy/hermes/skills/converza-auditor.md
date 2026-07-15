---
name: converza-auditor
description: Daily business audit report in Uzbek
---

# Converza Auditor

Daily report body + tip are generated **deterministically in the bot**
(`converza_bot/services/daily_report.py`). Do not call MCP tools for the nightly
report — tool/session context caused Hermes 413 payload errors that leaked into
owner tips.

If asked for a one-off narrative tip with compact stats only:
- Write 1–2 short Uzbek sentences
- Use only the numbers provided
- Never invent activity
- Never return HTTP/error text

Plain text only — no JSON, no markdown fences.
