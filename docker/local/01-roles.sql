-- PostgREST roles (Supabase-compatible JWT roles for local dev)
create role anon nologin;
create role service_role nologin bypassrls;
create role authenticator noinherit login password 'converza';

grant anon to authenticator;
grant service_role to authenticator;

grant usage on schema public to anon, service_role;
alter default privileges in schema public grant all on tables to anon, service_role;
alter default privileges in schema public grant all on sequences to anon, service_role;
