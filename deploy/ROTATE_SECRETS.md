# Rotate leaked Telegram tokens

Tokens pasted in chat or committed anywhere must be treated as **compromised**.

## 1. BotFather — revoke & reissue

For **each** bot (@ConverzaApp_bot, @ConverzaSales_bot):

1. Open [@BotFather](https://t.me/BotFather) → `/mybots` → select bot
2. **API Token** → **Revoke current token**
3. Copy the new token

Update on VPS only:

```bash
sudo nano /etc/converza/.env
# TELEGRAM_APP_BOT_TOKEN=<new app token>
# TELEGRAM_BOT_TOKEN=<new sales token>
```

Then redeploy:

```bash
cd /opt/converza && sudo ./scripts/go-live.sh
```

## 2. Webhook secret (optional but recommended)

Generate a new random string:

```bash
openssl rand -hex 32
```

Set `TELEGRAM_WEBHOOK_SECRET=` in `/etc/converza/.env`, run `go-live.sh` again.

## 3. JWT secret (if exposed)

Rotating `JWT_SECRET` logs out all web sessions. Generate with `openssl rand -hex 32`, update env, restart web container.

## 4. Never commit

- `/etc/converza/.env`
- `converza_bot/.env`
- `converza_web/Converza_ai/.env`

These paths are gitignored.
