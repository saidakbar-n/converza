"""Minimal Supabase client for the MCP server."""

import os

from supabase import create_client

_client = None


def get_sb():
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_KEY"]
        _client = create_client(url, key)
    return _client
