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
