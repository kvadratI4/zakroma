---
paths:
  - "deploy/**"
  - "backend/Dockerfile"
  - "backend/.dockerignore"
  - ".dockerignore"
  - ".github/**"
---

# Deploy rules (prod stack, ADR-0012, docs/09-deployment.md §2)

- Never publish ports of `db` or `api`; only Caddy has `ports`. A new service joins `db` (internal) only if it talks to Postgres.
- Secrets only as `${VAR}` references to `deploy/.env` (created by `backend/scripts/init_prod_env.py`); give each service only the variables it needs. Never read or print `deploy/.env`; never run `docker compose config` without `--images` (it prints the values), not even in CI logs.
- Database roles: the api uses `zakroma_app` (no DDL), migrations `zakroma_owner`; never the superuser. Role changes go into `deploy/db-init/10-roles.sh` and `tests/integration/test_db_roles.py` together.
- Containers keep `read_only`, `cap_drop: [ALL]`, `no-new-privileges` and capped logs (`x-hardening`); a new exception needs a comment why.
- Base images and actions are pinned by digest / SHA with the version in a comment; majors are changed by hand (Postgres needs `pg_upgrade`).
- Caddy: keep the CSP without `unsafe-inline`; a new header or route gets a check in `backend/tests/smoke/test_prod_stack.py`. No access log (tokens in paths).
- After changing the stack: `docker compose -f deploy/docker-compose.yml up -d --build --wait` (whole stack, no service name) and the smoke tests (CLAUDE.md, «Команды»).
