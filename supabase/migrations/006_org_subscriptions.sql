-- Converza platform subscription (paid via @ConverzaApp_bot + Click)

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
