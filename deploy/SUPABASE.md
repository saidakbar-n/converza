# Cloud Supabase — v1 migration

Apply before production go-live.

## Steps

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Paste and run the full contents of (in order):
   - [`supabase/migrations/003_align_live_schema.sql`](../supabase/migrations/003_align_live_schema.sql)
   - [`supabase/migrations/004_access_requests.sql`](../supabase/migrations/004_access_requests.sql)
   - [`supabase/migrations/005_brand_passport_columns.sql`](../supabase/migrations/005_brand_passport_columns.sql)
3. Verify in **Table Editor**:
   - `organizations` exists with `id` as `text`
   - `brand_passports.org_id` is `text`
4. Enable **Database → Backups** (and PITR if on a paid plan)

## Smoke test against cloud

On your dev machine (without `.env.local` override):

```bash
# Save passport from web or bot /profile
curl -s http://localhost:8001/health
```

Confirm no `invalid input syntax for type uuid` errors in logs.

## Local dev alternative

Use Docker Postgres instead of cloud:

```bash
cp .env.local.example .env.local
./scripts/local-db.sh start
```

See [scripts/LOCAL_DB.md](../scripts/LOCAL_DB.md).
