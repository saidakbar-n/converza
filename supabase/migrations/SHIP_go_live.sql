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

-- ─── 007 DM Closer (prospects + messages) ───
-- Run supabase/migrations/003_align_live_schema.sql first if org_id was uuid.
create table if not exists prospects (
    id uuid primary key default gen_random_uuid(),
    org_id text not null references organizations (id) on delete cascade,
    platform text not null default 'telegram',
    external_id text not null,
    conversation_id uuid,
    client_condition text default 'cold',
    condition_reason text,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (org_id, platform, external_id)
);

-- Older live DBs may have prospects without DM Closer columns.
alter table prospects
    add column if not exists platform text not null default 'telegram',
    add column if not exists external_id text,
    add column if not exists conversation_id uuid,
    add column if not exists client_condition text default 'cold',
    add column if not exists condition_reason text,
    add column if not exists metadata jsonb default '{}'::jsonb,
    add column if not exists updated_at timestamptz not null default now();

-- Legacy column: keep tg_user_id in sync with external_id (Telegram customer id).
update prospects
set external_id = tg_user_id::text
where external_id is null and tg_user_id is not null;

update prospects
set tg_user_id = external_id::bigint
where tg_user_id is null
  and external_id is not null
  and external_id ~ '^[0-9]+$';

update prospects
set tg_chat_id = tg_user_id
where tg_chat_id is null and tg_user_id is not null;

create index if not exists idx_prospects_org_id on prospects (org_id);

create table if not exists messages (
    id uuid primary key default gen_random_uuid(),
    org_id text not null references organizations (id) on delete cascade,
    prospect_id uuid references prospects (id) on delete set null,
    conversation_id uuid,
    direction text not null check (direction in ('inbound', 'outbound')),
    content text not null,
    sent_by text not null default 'ai',
    agent_model text,
    created_at timestamptz not null default now()
);

-- Older live DBs may have messages without conversation_id / agent_model.
alter table messages
    add column if not exists prospect_id uuid references prospects (id) on delete set null,
    add column if not exists conversation_id uuid,
    add column if not exists direction text default 'inbound',
    add column if not exists content text,
    add column if not exists sent_by text not null default 'ai',
    add column if not exists agent_model text,
    add column if not exists role text,
    add column if not exists created_at timestamptz not null default now();

update messages
set role = case when direction = 'inbound' then 'user' else 'assistant' end
where role is null and direction is not null;

create index if not exists idx_messages_org_prospect on messages (org_id, prospect_id);
create index if not exists idx_messages_conversation on messages (conversation_id);

-- ─── 007 org_subscription_payments ───
create table if not exists org_subscription_payments (
    id uuid primary key default gen_random_uuid(),
    org_id text not null references organizations (id) on delete cascade,
    amount_uzs integer not null,
    period_start timestamptz,
    period_end timestamptz,
    telegram_payment_charge_id text,
    paid_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create index if not exists idx_org_subscription_payments_org
    on org_subscription_payments (org_id, paid_at desc);

-- ─── 008 agent switchboard ───
create table if not exists agent_runs (
    id uuid primary key default gen_random_uuid(),
    org_id text not null references organizations (id) on delete cascade,
    agent_slug text not null check (agent_slug in ('milo', 'sleyz', 'vea')),
    triggered_by text not null check (triggered_by in ('owner', 'agent', 'system')),
    input_text text not null,
    status text not null default 'running'
        check (status in ('running', 'completed', 'failed', 'awaiting_hitl')),
    created_at timestamptz not null default now(),
    completed_at timestamptz
);

create table if not exists agent_run_steps (
    id uuid primary key default gen_random_uuid(),
    agent_run_id uuid not null references agent_runs (id) on delete cascade,
    org_id text not null references organizations (id) on delete cascade,
    agent_slug text not null check (agent_slug in ('milo', 'sleyz', 'vea')),
    step_label text not null,
    step_status text not null check (step_status in ('started', 'completed', 'failed')),
    detail text,
    created_at timestamptz not null default now()
);

create table if not exists squad_messages (
    id uuid primary key default gen_random_uuid(),
    org_id text not null references organizations (id) on delete cascade,
    sender_slug text not null,
    content text not null,
    mentions text[] not null default '{}',
    related_run_id uuid references agent_runs (id) on delete set null,
    hitl_draft_id uuid references drafts (id) on delete set null,
    created_at timestamptz not null default now()
);

create table if not exists agent_memory (
    id uuid primary key default gen_random_uuid(),
    org_id text not null references organizations (id) on delete cascade,
    agent_slug text not null check (agent_slug in ('milo', 'sleyz', 'vea')),
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    created_at timestamptz not null default now()
);

alter table drafts
    add column if not exists agent_slug text,
    add column if not exists final_content text,
    add column if not exists decided_at timestamptz,
    add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_agent_runs_org on agent_runs (org_id, created_at desc);
create index if not exists idx_agent_run_steps_org on agent_run_steps (org_id, created_at desc);
create index if not exists idx_squad_messages_org on squad_messages (org_id, created_at desc);
create index if not exists idx_agent_memory_org on agent_memory (org_id, agent_slug, created_at desc);
