# Converza v1 — Pilot checklist

Run before calling v1 shipped. Automated checks first, then manual Telegram steps.

## 0. Automated (laptop)

```bash
chmod +x scripts/verify-production.sh scripts/go-live.sh scripts/pilot-check.sh
./scripts/verify-production.sh https://getconverza.com
```

**Must pass:**

- [ ] `/api/auth/config` → `bot_username: ConverzaApp_bot` + `sales_bot_username`
- [ ] `/webhook/telegram` and `/webhook/app` not 502
- [ ] `getWebhookInfo` URLs point to getconverza.com (run `scripts/verify-webhooks.sh` on VPS)

## 1. Supabase

- [ ] `SHIP_go_live.sql` applied (access_requests, org_subscriptions exist)
- [ ] Backups enabled in Supabase dashboard

## 2. Owner setup (App bot + web)

- [ ] Owner submits access request on getconverza.com
- [ ] Admin approves at `/admin` or @ConverzaApp_bot `/pending` → ✅
- [ ] Owner logs in via **Telegram widget (@ConverzaApp_bot)**
- [ ] Owner saves brand passport (pricing, FAQ, objections)
- [ ] @ConverzaApp_bot `/subscribe` → Click payment → subscription active (web panel shows obuna faol)
- [ ] @ConverzaApp_bot `/report` → kunlik hisobot received

## 3. Sales bot (Business DM)

- [ ] Owner connects **@ConverzaSales_bot**: Telegram → Business → Chatbots
- [ ] Web panel: **Biznes ulanishi faol**
- [ ] @ConverzaApp_bot `/status` → subscription + passport + Business all ✅

## 4. Customer sales loop (critical)

DM Closer requires: active subscription + Business connection + passport (name, offer, pricing).

- [ ] Second account messages **owner's business account** (not bot DM)
- [ ] DM Closer replies within ~30s using passport context
- [ ] Optional: client Click invoice (org `click_token` in passport)
- [ ] Non-text message → Uzbek fallback

## 5. Co-Pilot

- [ ] Co-Pilot tab unlocked after passport save
- [ ] `./scripts/diag-copilot.sh <org_id>` streams Uzbek reply (Groq when `GROQ_API_KEY` set)
- [ ] Web panel Co-Pilot tab → Uzbek message → streamed reply

## 6. Security & ops

- [ ] Leaked bot tokens rotated ([ROTATE_SECRETS.md](ROTATE_SECRETS.md))
- [ ] `TELEGRAM_WEBHOOK_SECRET` set on VPS
- [ ] Unauthenticated API → 401
- [ ] Hermes container healthy: `curl http://127.0.0.1:8642/health` on VPS
- [ ] Hermes does **not** own Telegram (`TELEGRAM_*` absent from Hermes `.env`; sales bot DMs show Converza redirect, not Hermes pairing)

## Agent smoke test (VPS)

```bash
chmod +x scripts/test-agent.sh
./scripts/test-agent.sh
# With org id after owner setup (owner Telegram user id):
./scripts/test-agent.sh <org_id>
```

Hermes-only check: reply contains `AGENT_OK`. Full closer validation: section 4 (Real Telegram Business DM).

## 7. Nightly report

- [ ] Cron 23:59 Asia/Tashkent sends 📊 KUNLIK HISOBOT to subscribed orgs (or test `/report`)
