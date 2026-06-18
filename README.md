# Converza

Multi-tenant Telegram DM Closer + web Co-Pilot for Uzbek businesses.

## Architecture

- **converza_bot** (`:8000`) — Telegram webhooks, DM Closer (Groq), owner onboarding
- **converza_web** (`:8001`) — Brand passport SPA, Telegram login, Co-Pilot (KIE / Anthropic)
- **Supabase** — Organizations, brand passports, prospects, messages
- **Production** — DigitalOcean VPS + Nginx + `getconverza.com` (see [deploy/GETCONVERZA.COM.md](deploy/GETCONVERZA.COM.md), [deploy/DEPLOY.md](deploy/DEPLOY.md))

### Product flow

1. Owner submits an **access request** on the web (admin approves at `/admin`)
2. After approval, owner logs in via Telegram and saves a **brand passport**
3. Owner connects `@ConverzaSales_bot` via **Telegram → Business → Chatbots**
4. Customers message the **owner's business account** → `business_message` → DM Closer replies

Set `ADMIN_TELEGRAM_IDS` in `.env` to your Telegram user id(s). Admins can manage access at `/admin` (web) or via bot commands (`/admin`, `/pending`, `/approve`, `/reject`).

Owner DMs to the bot directly are for setup (`/profile`, PDF upload, `/fill`).

## Local development

```bash
# Optional: local Postgres instead of cloud Supabase
cp .env.local.example .env.local
./scripts/local-db.sh start

# Bot
cd converza_bot && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in keys
uvicorn main:app --reload --port 8000

# Web (separate terminal)
cd converza_web/Converza_ai && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8001
```

For Telegram Login + webhooks on one domain, point ngrok at **:8001** (web proxies `/webhook/*` to the bot).

See [scripts/LOCAL_DB.md](scripts/LOCAL_DB.md) and [scripts/WEBHOOK.md](scripts/WEBHOOK.md).

## Production deploy

See [deploy/DEPLOY.md](deploy/DEPLOY.md) and [deploy/PILOT.md](deploy/PILOT.md).

```bash
cp .env.production.example /etc/converza/.env   # fill on VPS
docker compose -f docker-compose.prod.yml up -d --build
```

## Migrations

SQL files live in `supabase/migrations/`. Apply `003_align_live_schema.sql` on cloud Supabase before go-live.

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/register_webhook.sh` | Register Telegram webhook |
| `scripts/smoke-test.sh` | Post-deploy health checks |
| `scripts/local-db.sh` | Local Postgres via Docker |
