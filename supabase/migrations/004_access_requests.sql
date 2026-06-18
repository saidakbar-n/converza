-- Access requests: users must be approved before Telegram login / brand passport.

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
