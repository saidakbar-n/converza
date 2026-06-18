-- Converza shared Supabase schema
-- Apply via Supabase SQL editor or: supabase db push

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Organizations (Telegram business owners)
-- id = Telegram user id of the business owner (text)
-- ---------------------------------------------------------------------------
create table if not exists organizations (
    id text primary key,
    business_connection_id text unique,
    click_token text,
    brand_context jsonb,  -- legacy; deprecated — use brand_passports
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_organizations_business_connection
    on organizations (business_connection_id)
    where business_connection_id is not null;

-- ---------------------------------------------------------------------------
-- Brand Passports (canonical agent context — one per org)
-- ---------------------------------------------------------------------------
create table if not exists brand_passports (
    id uuid primary key default gen_random_uuid(),
    org_id text not null unique references organizations (id) on delete cascade,
    brand_name text not null,
    industry text default '',
    target_location text default 'Uzbekistan',
    target_audience text not null default '',
    core_offer text not null default '',
    tone text default 'Friendly, confident, and concise',
    pricing jsonb not null default '[]'::jsonb,
    faq jsonb not null default '[]'::jsonb,
    objections jsonb not null default '[]'::jsonb,
    raw_notes text default '',
    updated_at timestamptz not null default now()
);

create index if not exists idx_brand_passports_org_id on brand_passports (org_id);

-- ---------------------------------------------------------------------------
-- Telegram connections (optional metadata per org)
-- ---------------------------------------------------------------------------
create table if not exists tg_connections (
    id uuid primary key default gen_random_uuid(),
    org_id text not null references organizations (id) on delete cascade,
    connection_data jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists idx_tg_connections_org_id on tg_connections (org_id);

-- ---------------------------------------------------------------------------
-- DM Closer: prospects and messages
-- ---------------------------------------------------------------------------
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

create index if not exists idx_messages_org_prospect on messages (org_id, prospect_id);
create index if not exists idx_messages_conversation on messages (conversation_id);

create table if not exists drafts (
    id uuid primary key default gen_random_uuid(),
    org_id text not null references organizations (id) on delete cascade,
    prospect_id uuid references prospects (id) on delete set null,
    conversation_id uuid not null,
    draft_content text not null,
    context_summary text,
    status text not null default 'pending',
    reviewed_by text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Web Co-Pilot: conversations and DAG runs
-- ---------------------------------------------------------------------------
create table if not exists conversation_messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null,
    role text not null check (role in ('user', 'assistant', 'system')),
    content text not null,
    dag_run_id uuid,
    created_at timestamptz not null default now()
);

create index if not exists idx_conversation_messages_conv
    on conversation_messages (conversation_id);

create table if not exists dag_runs (
    id uuid primary key default gen_random_uuid(),
    user_id text,
    brand_id uuid references brand_passports (id) on delete set null,
    user_message text not null,
    status text not null default 'pending',
    stage text default 'assessing',
    dag_plan jsonb,
    started_at timestamptz not null default now(),
    completed_at timestamptz
);

create table if not exists dag_node_runs (
    id uuid primary key default gen_random_uuid(),
    run_id uuid not null references dag_runs (id) on delete cascade,
    node_id text not null,
    agent_type text not null,
    status text not null default 'pending',
    input_payload jsonb default '{}'::jsonb,
    output_payload jsonb,
    created_at timestamptz not null default now(),
    completed_at timestamptz
);

create index if not exists idx_dag_node_runs_run_id on dag_node_runs (run_id);
