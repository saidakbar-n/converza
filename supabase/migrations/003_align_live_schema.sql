-- Converza — align the live database with the unified multi-tenant schema.
--
-- WHY: the live project was created with an older schema where `org_id` is a
-- uuid and the `organizations` table does not exist. The application now uses
-- the Telegram business owner's user id (text) as `org_id`, so real logins fail
-- with: invalid input syntax for type uuid: "<telegram id>".
--
-- This script is idempotent and safe to run multiple times.
-- HOW TO APPLY: Supabase → SQL Editor → paste this whole file → Run.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1) Organizations (Telegram business owners). id = Telegram user id (text).
--    Required for login metadata + business_connection → org routing.
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
-- 2) Convert org_id columns from uuid -> text so they can hold Telegram ids.
--    Guarded so it only runs where the table+column exist and are still uuid,
--    and drops any default first (a uuid default would block the type change).
--    Fully idempotent: re-running after conversion is a harmless no-op.
-- ---------------------------------------------------------------------------
do $$
declare
    t text;
begin
    foreach t in array array['brand_passports', 'tg_connections', 'prospects', 'messages', 'drafts']
    loop
        if exists (
            select 1 from information_schema.columns
            where table_schema = 'public'
              and table_name = t
              and column_name = 'org_id'
              and data_type = 'uuid'
        ) then
            execute format('alter table public.%I alter column org_id drop default', t);
            execute format('alter table public.%I alter column org_id type text using org_id::text', t);
        end if;
    end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3) Web Co-Pilot tables that are missing from the live database.
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
