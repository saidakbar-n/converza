-- Ensure brand_passports has every column the app writes (idempotent).
-- Run in Supabase SQL Editor if save fails with PGRST204 missing column.

alter table brand_passports
    add column if not exists industry text default '',
    add column if not exists target_location text default 'Uzbekistan',
    add column if not exists tone text default 'Friendly, confident, and concise',
    add column if not exists pricing jsonb not null default '[]'::jsonb,
    add column if not exists faq jsonb not null default '[]'::jsonb,
    add column if not exists objections jsonb not null default '[]'::jsonb,
    add column if not exists raw_notes text default '';
