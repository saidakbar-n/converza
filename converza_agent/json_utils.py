"""Parse JSON from Hermes model output."""

import json
import re


def extract_json_object(text: str) -> dict:
    """Return the first JSON object found in model text."""
    cleaned = (text or "").strip()
    if not cleaned:
        raise ValueError("Empty model response")

    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
    if fence:
        cleaned = fence.group(1)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end > start:
            return json.loads(cleaned[start : end + 1])
        raise
