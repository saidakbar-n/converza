# Converza v1 — Pilot checklist

Run through this with a real business owner before calling v1 shipped.

## Automated pre-checks (run first)

```bash
chmod +x scripts/pilot-check.sh scripts/smoke-test.sh
scripts/pilot-check.sh https://yourdomain.com
```

This verifies health endpoints, auth gates, bot imports (`owner_org_id`), unit tests, and webhook proxy error surfacing. It does **not** replace the manual Telegram steps below.

## Owner setup

- [ ] Owner submits access request (biznes nomi, muammo/og'riq nuqtasi, telefon, @username)
- [ ] Admin sees business name, pain point, phone, and sent date on `/admin` or bot `/pending`
- [ ] Admin approves request at `https://yourdomain.com/admin` or bot `/pending` → ✅ Tasdiqlash
- [ ] Owner opens `https://yourdomain.com` and logs in via Telegram widget (after approval)
- [ ] Owner fills and saves brand passport (pricing, FAQ, objections)
- [ ] Web shows metrics updated after save
- [ ] Owner connects bot: **Telegram → Settings → Business → Chatbots → @ConverzaSales_bot**
- [ ] Web connection panel shows **"Biznes ulanishi faol"**
- [ ] Bot `/status` shows passport name + business connection active

## Co-Pilot (owner strategy tool)

- [ ] Co-Pilot tab unlocked after passport save
- [ ] Send Uzbek message → streamed reply from KIE
- [ ] Bot `/profile` shows same passport as web

## Customer sales loop (critical)

DM Closer only replies when **both** are true: Telegram Business connected (`business_connection_id` set) and brand passport saved (name, offer, pricing).

- [ ] Second Telegram account messages **owner's business account** (not the bot DM)
- [ ] DM Closer replies in that chat within ~30 seconds
- [ ] Reply uses brand passport context (mentions offer/pricing appropriately)
- [ ] Optional: invoice flow works with configured Click token
- [ ] Non-text customer message gets Uzbek fallback asking for text

## Security & ops

- [ ] Unauthenticated API call returns 401
- [ ] `scripts/smoke-test.sh https://yourdomain.com` passes
- [ ] `getWebhookInfo` shows no recent errors
- [ ] `/test_invoice` disabled in production bot commands

## Database

- [ ] Cloud Supabase migration `003_align_live_schema.sql` applied
- [ ] `organizations.business_connection_id` populated after owner connects Business
- [ ] Supabase backups enabled
