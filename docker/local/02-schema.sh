#!/bin/bash
set -euo pipefail
# Runs after 01-roles.sql on first container init.
for f in /migrations/001_initial_schema.sql /migrations/002_optional_agent_columns.sql; do
  echo "Applying $(basename "$f")..."
  psql -v ON_ERROR_STOP=1 -U postgres -d converza -f "$f"
done
# Grant table access to API roles (tables now exist)
psql -v ON_ERROR_STOP=1 -U postgres -d converza <<'SQL'
grant all on all tables in schema public to anon, service_role;
grant all on all sequences in schema public to anon, service_role;
SQL
echo "Local schema ready."
