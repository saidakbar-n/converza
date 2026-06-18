-- Optional columns for richer Co-Pilot agent context.
-- Safe to run on existing projects; columns are nullable / have defaults.

alter table brand_passports
    add column if not exists hex_colors jsonb not null default '[]'::jsonb,
    add column if not exists competitors jsonb not null default '[]'::jsonb,
    add column if not exists avoid_topics jsonb not null default '[]'::jsonb,
    add column if not exists source text default 'web_form';

-- brand_voice is derived from tone in application code; add only if you want
-- to store it separately:
-- alter table brand_passports add column if not exists brand_voice text;
