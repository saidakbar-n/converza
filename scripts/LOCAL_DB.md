# Local PostgreSQL (dev) — keep cloud Supabase for later

Converza apps use the **Supabase REST client** (`supabase-py`), not a direct Postgres driver. Local dev runs **PostgreSQL + PostgREST** behind the same `/rest/v1` URL shape as cloud Supabase. Your cloud `.env` values stay in place; `.env.local` overrides only `SUPABASE_URL` and keys.

## Quick start

1. **Start Docker Desktop** (required for the compose stack).

2. From the repo root:

```bash
cp .env.local.example .env.local
./scripts/local-db.sh start
./scripts/local-db.sh test
```

Expected test output:

```
OK — brand_passports write/read: {'brand_name': 'Local Test Brand'}
```

3. **Restart** the bot (8000) and web (8001) so they reload `.env.local`.

4. Use the app as usual — login, save passport, send PDF to bot. Data goes to **local** Postgres (`org_id` is `text`, `organizations` table exists).

## Switch back to cloud Supabase

```bash
./scripts/local-db.sh stop
rm .env.local   # or rename it
# restart bot + web
```

Apps read `converza_bot/.env` / `converza_web/.env` cloud `SUPABASE_URL` again.

## Commands

| Command | Action |
|---------|--------|
| `./scripts/local-db.sh start` | Start Postgres + API on `:54321` |
| `./scripts/local-db.sh stop` | Stop containers |
| `./scripts/local-db.sh reset` | Wipe data and re-apply schema |
| `./scripts/local-db.sh test` | Upsert/read test for your Telegram id |
| `./scripts/local-db.sh status` | Health check |

## Ports

| Service | URL |
|---------|-----|
| REST API (apps) | `http://127.0.0.1:54321` |
| Postgres (psql) | `postgresql://postgres:postgres@127.0.0.1:5433/converza` |

## After local works

Run `supabase/migrations/003_align_live_schema.sql` in **cloud** Supabase SQL Editor to fix the live project (`organizations` missing, `org_id` still `uuid`). Local schema already uses `text` org_id from `001_initial_schema.sql`.
