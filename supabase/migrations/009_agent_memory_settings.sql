-- Pinned agent memory + per-org model role settings

alter table agent_memory
    add column if not exists pinned boolean not null default false,
    add column if not exists source text;

create index if not exists idx_agent_memory_pinned
    on agent_memory (org_id, pinned, created_at desc);

create table if not exists org_model_settings (
    org_id text primary key references organizations (id) on delete cascade,
    settings jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);
