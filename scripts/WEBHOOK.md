# Telegram webhook & BotFather setup

The bot serves the Telegram webhook at `POST /webhook/telegram` (FastAPI bot on
`:8000`, router prefix `/webhook`). In the single-domain setup, the public
`https://<DOMAIN>` points at the **web** app (`:8001`), which proxies
`/webhook/*` to the bot at `BOT_INTERNAL_URL` (`http://localhost:8000`).

## register_webhook.sh

The token is read from the environment (never hardcoded): it uses
`$TELEGRAM_BOT_TOKEN` if exported, otherwise the `TELEGRAM_BOT_TOKEN=` line in
`converza_bot/.env`. The public domain is `$1` or `$WEBHOOK_DOMAIN`.

```bash
# Register the webhook to https://<domain>/webhook/telegram
scripts/register_webhook.sh set bluegill-key-precisely.ngrok-free.app

# Or via env var instead of positional arg
WEBHOOK_DOMAIN=app.example.com scripts/register_webhook.sh set

# Inspect the current webhook (getWebhookInfo)
scripts/register_webhook.sh info

# Remove the webhook (deleteWebhook, drops pending updates)
scripts/register_webhook.sh delete
```

Pass the bare host (no scheme, no trailing slash); `https://` is enforced
because Telegram requires HTTPS for webhooks. Run this yourself when ready to go
live — it calls the public Telegram Bot API.

## BotFather steps (separate from the webhook)

The **webhook** (above) is how Telegram delivers updates to the bot. The
**login widget domain** is a separate BotFather setting used by the web app's
Telegram Login button.

1. Open [@BotFather](https://t.me/BotFather) → `/mybots` → select
   **`@ConverzaApp_bot`** (not the sales bot).
2. **Login widget domain:** `Bot Settings` → `Domain` → `/setdomain`, then send
   `getconverza.com` (no `https://`). This must match the site serving the
   Telegram Login widget — the web app uses `@ConverzaApp_bot` for login.
3. **Click payments:** on `@ConverzaApp_bot` → `Payments` → Click (Converza
   subscription via `/subscribe`). End-customer invoices use each org's token on
   `@ConverzaSales_bot` (optional).
4. **Business mode (per owner):** Telegram → `Settings` → `Telegram Business` →
   `Chatbots` → add **`@ConverzaSales_bot`**. Done by each owner, not BotFather.
5. Webhooks are set via script (not BotFather) — both bots, one domain:

```bash
WEB_APP_URL=https://getconverza.com \
TELEGRAM_WEBHOOK_SECRET=your_secret \
TELEGRAM_BOT_TOKEN=... \
TELEGRAM_APP_BOT_TOKEN=... \
./scripts/set_telegram_webhooks.sh
```

   - Sales: `https://getconverza.com/webhook/telegram`
   - App:   `https://getconverza.com/webhook/app`

6. **Production:** set `TELEGRAM_WEBHOOK_SECRET` in `/etc/converza/.env` before
   running the webhook script.

## Production domain

```bash
export TELEGRAM_WEBHOOK_SECRET=your_long_random_secret
./scripts/register_webhook.sh set yourdomain.com
./scripts/register_webhook.sh info
```

BotFather `/setdomain` must match `WEB_APP_URL` host (without `https://`).

After changing the domain or going live, run
`scripts/register_webhook.sh info` to confirm `url` and that there are no
`last_error_message` entries.
