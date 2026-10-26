#!/bin/sh
# Database roles of the prod stack (T-007). The postgres image runs this once, when the data volume
# is initialised; later password or role changes are manual (docs/09-deployment.md §2).
#   zakroma_owner — owns the database and the public schema, runs migrations; not a superuser.
#   zakroma_app   — the api: SELECT/INSERT/UPDATE/DELETE on what the owner creates, no DDL.
# Passwords arrive as psql variables, never spliced into the SQL text.
# Checked by backend/tests/integration/test_db_roles.py.
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  -v owner_password="$ZAKROMA_OWNER_PASSWORD" \
  -v app_password="$ZAKROMA_APP_PASSWORD" <<'SQL'
CREATE ROLE zakroma_owner LOGIN PASSWORD :'owner_password';
CREATE ROLE zakroma_app LOGIN PASSWORD :'app_password';
CREATE DATABASE zakroma OWNER zakroma_owner;
-- By default every role may connect to the maintenance database.
REVOKE CONNECT ON DATABASE postgres FROM PUBLIC;

\connect zakroma
REVOKE ALL ON DATABASE zakroma FROM PUBLIC;
GRANT CONNECT ON DATABASE zakroma TO zakroma_app;
GRANT USAGE ON SCHEMA public TO zakroma_app;
-- Tables and sequences the owner creates in migrations become usable by the api.
ALTER DEFAULT PRIVILEGES FOR ROLE zakroma_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO zakroma_app;
ALTER DEFAULT PRIVILEGES FOR ROLE zakroma_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO zakroma_app;
SQL
