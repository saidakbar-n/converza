-- Brand Vault / paywall onboarding columns (Hermes-readable core fields already exist)

alter table brand_passports
  add column if not exists owner_user_id text,
  add column if not exists onboarding_answers jsonb default '{}'::jsonb,
  add column if not exists current_marketing_handler text,
  add column if not exists current_marketing_spend numeric,
  add column if not exists current_reply_handler text,
  add column if not exists weekly_message_volume int,
  add column if not exists primary_pain_point text,
  add column if not exists primary_goal text,
  add column if not exists channels_requested text[] default '{}',
  add column if not exists owner_name text,
  add column if not exists owner_contact text,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists paywall_status text default 'pending';

create index if not exists idx_brand_passports_owner_user_id
  on brand_passports (owner_user_id);

-- Optional structured colors for Brand Vault (no-op if jsonb already exists from 002)
alter table brand_passports
  add column if not exists hex_colors text[] default '{}';
