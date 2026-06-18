# Converza v1 — VPS deployment

Target: Ubuntu 22.04+ on DigitalOcean (or similar) with a domain and cloud Supabase.

**Production domain:** see [GETCONVERZA.COM.md](GETCONVERZA.COM.md) for `getconverza.com` on droplet `162.243.174.80`.

## Prerequisites

- Domain DNS A record → VPS public IP (`162.243.174.80` for getconverza.com)
- Cloud Supabase project with migration `003_align_live_schema.sql` applied
- API keys: Groq, KIE, Anthropic, Telegram bot token, Click provider token
- `TELEGRAM_WEBHOOK_SECRET` and `JWT_SECRET` — long random strings

## 1. Server bootstrap

```bash
ssh root@your-vps
./deploy/setup-vps.sh
```

## 2. Environment

```bash
sudo mkdir -p /etc/converza
sudo cp .env.production.example /etc/converza/.env
sudo nano /etc/converza/.env   # fill all values
```

Required:

| Variable | Example |
|----------|---------|
| `ENV` | `production` |
| `WEB_APP_URL` | `https://getconverza.com` |
| `ALLOWED_ORIGINS` | `https://getconverza.com` |
| `SUPABASE_URL` | cloud project URL |
| `SUPABASE_SERVICE_KEY` | service role key |
| `ADMIN_TELEGRAM_IDS` | your Telegram user id (comma-separated) |

Do **not** set `DEFAULT_ORG_ID` in production.

Optional for multi-instance bot deploys:

| Variable | Purpose |
|----------|---------|
| `REDIS_URL` | Shared Telegram `update_id` dedup across workers (falls back to in-memory if unset) |

Admin panel: `https://yourdomain.com/admin` — approve access requests before users can log in.

**Bot admin (same `ADMIN_TELEGRAM_IDS`):** DM the bot → `/admin`, `/pending`, tap ✅/❌, or `/approve <id>` / `/reject <id>`.

## 3. Deploy services

```bash
cd /opt/converza   # or your clone path
docker compose -f docker-compose.prod.yml up -d --build
curl -s http://127.0.0.1:8001/health
curl -s http://127.0.0.1:8000/health
```

## 4. Nginx + SSL (reverse proxy)

**getconverza.com (recommended):**

```bash
DOMAIN=getconverza.com CERTBOT_EMAIL=admin@getconverza.com sudo -E ./deploy/setup-nginx.sh
```

**Other domain (manual):**

```bash
sudo cp deploy/nginx/converza.conf /etc/nginx/sites-available/converza
sudo sed -i 's/YOUR_DOMAIN/yourdomain.com/g' /etc/nginx/sites-available/converza
sudo ln -sf /etc/nginx/sites-available/converza /etc/nginx/sites-enabled/
sudo certbot --nginx -d yourdomain.com
sudo nginx -t && sudo systemctl reload nginx
```

## 5. Telegram

```bash
# Webhook (includes business_message + business_connection)
TELEGRAM_WEBHOOK_SECRET=your_secret ./scripts/register_webhook.sh set getconverza.com

# BotFather → Bot Settings → Domain → getconverza.com (Login widget)
```

To register webhook **with** secret token, use:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://getconverza.com/webhook/telegram" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET" \
  -d 'allowed_updates=["message","callback_query","business_connection","business_message","pre_checkout_query"]'
```

## 6. Verify

```bash
./scripts/pilot-check.sh https://getconverza.com
```

See [PILOT.md](PILOT.md) for the full owner journey checklist (includes manual Telegram Business + customer DM test).

## Supabase migration

Run in Supabase SQL Editor before go-live:

```
supabase/migrations/003_align_live_schema.sql
```

Enable backups / PITR in the Supabase dashboard.
