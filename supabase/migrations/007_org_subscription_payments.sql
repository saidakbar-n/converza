-- Subscription payment history (one row per successful Telegram/Click charge)

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
