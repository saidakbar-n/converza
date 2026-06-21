"""Hermes gateway connection settings."""

import os


def hermes_base_url() -> str:
    return os.getenv("HERMES_URL", "http://127.0.0.1:8642").rstrip("/")


def hermes_api_key() -> str:
    return (
        os.getenv("HERMES_API_KEY")
        or os.getenv("API_SERVER_KEY")
        or ""
    ).strip()


def hermes_model() -> str:
    return os.getenv("HERMES_MODEL", "hermes-agent")


def hermes_configured() -> bool:
    return bool(hermes_api_key())
