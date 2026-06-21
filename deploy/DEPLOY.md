# Converza v1 — VPS deployment

Target: Ubuntu 22.04+ on DigitalOcean with **getconverza.com** (`162.243.174.80`).

See also: [GETCONVERZA.COM.md](GETCONVERZA.COM.md), [PILOT.md](PILOT.md), [ROTATE_SECRETS.md](ROTATE_SECRETS.md).

## Quick go-live (VPS)

```bash
ssh root@162.243.174.80
cd /opt/converza
git pull
sudo cp .env.production.example /etc/converza/.env   # first time only
sudo nano /etc/converza/.env                          # fill all values
sudo chmod +x scripts/go-live.sh scripts/set_telegram_webhooks.sh scripts/verify-webhooks.sh
sudo ./scripts/go-live.sh
```

From your laptop:

```bash
./scripts/verify-production.sh https://getconverza.com
```

## Prerequisites

- DNS A record → `162.243.174.80`
- Supabase: run [../supabase/migrations/SHIP_go_live.sql](../supabase/migrations/SHIP_go_live.sql) in SQL Editor
- **Rotate** any Telegram tokens that were ever pasted in chat ([ROTATE_SECRETS.md](ROTATE_SECRETS.md))

## Environment (`/etc/converza/.env`)

| Variable | Purpose |
|----------|---------|
| `ENV` | `production` |
| `WEB_APP_URL` | `https://getconverza.com` |
| `ALLOWED_ORIGINS` | `https://getconverza.com` |
| `TELEGRAM_BOT_TOKEN` | @ConverzaSales_bot |
| `TELEGRAM_APP_BOT_TOKEN` | @ConverzaApp_bot |
| `TELEGRAM_APP_BOT_USERNAME` | `ConverzaApp_bot` |
| `TELEGRAM_WEBHOOK_SECRET` | random hex (webhook auth) |
| `HERMES_API_KEY` | same as `API_SERVER_KEY` |
| `GOOGLE_API_KEY` | **Gemini** via [AI Studio](https://aistudio.google.com/apikey) (or `ANTHROPIC_API_KEY` for Claude) |
| `CONVERZA_SUBSCRIPTION_PROVIDER_TOKEN` | Click on **App bot** (BotFather → Payments) |
| `SUBSCRIPTION_REQUIRED` | `true` |
| `JWT_SECRET` | web session signing |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | cloud project |

Services: **hermes** (:8642) + **bot** (:8000) + **web** (:8001), host network.

## Supabase migrations

Run once in SQL Editor (idempotent):

```
supabase/migrations/SHIP_go_live.sql
```

Includes: `access_requests`, brand passport columns, `org_subscriptions`.

## Telegram (two bots)

| Bot | Webhook | BotFather |
|-----|---------|-----------|
| @ConverzaSales_bot | `https://getconverza.com/webhook/telegram` | Business Chatbots only — **no** website domain |
| @ConverzaApp_bot | `https://getconverza.com/webhook/app` | Domain `getconverza.com` + Click payments |

Webhooks are registered by `scripts/go-live.sh` (or manually):

```bash
source /etc/converza/.env
WEB_APP_URL=https://getconverza.com ./scripts/set_telegram_webhooks.sh
./scripts/verify-webhooks.sh
```

## Nginx + SSL

```bash
DOMAIN=getconverza.com CERTBOT_EMAIL=admin@getconverza.com sudo -E ./deploy/setup-nginx.sh
```

## Verify

```bash
./scripts/verify-production.sh https://getconverza.com
./scripts/pilot-check.sh https://getconverza.com
```

Complete manual steps in [PILOT.md](PILOT.md) (access → login → passport → subscribe → Business → DM).

## Admin

- Web: `https://getconverza.com/admin`
- App bot DM: `/admin`, `/pending`, `/approve`, `/reject` (same `ADMIN_TELEGRAM_IDS`)
