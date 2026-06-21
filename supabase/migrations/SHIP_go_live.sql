-- Converza go-live bundle — paste into Supabase SQL Editor (idempotent)
-- Run sections you may not have applied yet. Order: 004 → 005 → 006.

-- ─── 004 access_requests ───
create table if not exists access_requests (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    business_name text not null,
    telegram_username text,
    contact text not null,
    message text default '',
    status text not null default 'pending'
        check (status in ('pending', 'approved', 'rejected')),
    telegram_id text,
    review_note text,
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_access_requests_status
    on access_requests (status, created_at desc);

create index if not exists idx_access_requests_telegram_username
    on access_requests (lower(telegram_username))
    where telegram_username is not null;

create index if not exists idx_access_requests_telegram_id
    on access_requests (telegram_id)
    where telegram_id is not null;

create unique index if not exists idx_access_requests_pending_username
    on access_requests (lower(telegram_username))
    where status = 'pending' and telegram_username is not null;

-- ─── 005 brand_passport columns ───
alter table brand_passports
    add column if not exists brand_name text,
    add column if not exists industry text default '',
    add column if not exists target_location text default 'Uzbekistan',
    add column if not exists target_audience text default '',
    add column if not exists core_offer text default '',
    add column if not exists tone text default 'Friendly, confident, and concise',
    add column if not exists pricing jsonb not null default '[]'::jsonb,
    add column if not exists faq jsonb not null default '[]'::jsonb,
    add column if not exists objections jsonb not null default '[]'::jsonb,
    add column if not exists raw_notes text default '',
    add column if not exists updated_at timestamptz not null default now();

-- ─── 006 org_subscriptions ───
create table if not exists org_subscriptions (
    org_id text primary key references organizations (id) on delete cascade,
    status text not null default 'inactive'
        check (status in ('inactive', 'active', 'past_due', 'cancelled')),
    amount_uzs integer,
    current_period_start timestamptz,
    current_period_end timestamptz,
    last_payment_at timestamptz,
    telegram_payment_charge_id text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_org_subscriptions_status
    on org_subscriptions (status, current_period_end desc);
