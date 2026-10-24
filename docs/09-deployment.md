# 09. Развёртывание

Решение — [ADR-0002](adr/0002-hosting-ru-vps-docker-compose.md). Диаграмма — [diagrams/deployment.md](diagrams/deployment.md).

## 1. Инфраструктура

| Ресурс | Требование | Ориентир стоимости |
|---|---|---|
| VPS в РФ | 1–2 vCPU, 2 ГБ RAM, 20+ ГБ SSD, Ubuntu 24.04 LTS | 300–600 ₽/мес |
| Домен | `.ru` или поддомен существующего | ~200 ₽/год |
| Объектное хранилище (S3-совместимое, у того же или другого провайдера) | для бэкапов, < 1 ГБ | десятки ₽/мес |

Цены и тарифы проверяются при выборе провайдера (задача T-041), здесь — ориентиры.

## 2. Состав Docker Compose (prod)

| Сервис | Образ | Назначение |
|---|---|---|
| `caddy` | `caddy` | HTTPS (Let's Encrypt), раздача SPA, прокси `/api/*` → `api:8000`, gzip/zstd, заголовки безопасности |
| `api` | собственный (`backend/Dockerfile`) | FastAPI под uvicorn (2 воркера) |
| `db` | `postgres:16` (или новее) | Данные; том `pgdata` |
| `backup` | собственный маленький (postgres-client + rclone + age) | `pg_dump` по cron, шифрование, выгрузка в S3, ротация |

SPA собирается в образ `caddy` (multi-stage: `node` → статика → `caddy`), отдельный сервис `web` не нужен.

Caddyfile (эскиз):

```caddy
{$DOMAIN} {
    encode zstd gzip
    handle /api/* {
        reverse_proxy api:8000
    }
    handle {
        root * /srv/web
        try_files {path} /index.html
        file_server
    }
    header {
        Strict-Transport-Security "max-age=31536000"
        X-Content-Type-Options nosniff
        Referrer-Policy strict-origin-when-cross-origin
    }
    @sw path /sw.js /manifest.webmanifest
    header @sw Cache-Control "no-cache"
}
```

## 3. Подготовка сервера (однократно, T-041)

1. Создать VPS, добавить SSH-ключ, отключить вход по паролю.
2. `ufw`: открыть 22, 80, 443. Включить `unattended-upgrades`.
3. Установить Docker Engine и плагин Compose.
4. Создать пользователя `deploy` (группа `docker`), каталог `/opt/zakroma` с `docker-compose.yml`, `Caddyfile`, `.env`.
5. DNS: A-запись домена → IP VPS.
6. Первый запуск: `docker compose up -d`, проверить `https://<домен>/api/v1/health`.

`.env` (на сервере, не в git; шаблон — `deploy/.env.example`):

```
DOMAIN=zakroma.example.ru
POSTGRES_PASSWORD=…
DATABASE_URL=postgresql+asyncpg://zakroma:…@db:5432/zakroma
SESSION_SECRET=…
BACKUP_S3_ENDPOINT=… BACKUP_S3_BUCKET=… BACKUP_S3_KEY=… BACKUP_S3_SECRET=…
BACKUP_AGE_RECIPIENT=age1…
```

## 4. CI/CD

```mermaid
flowchart LR
    PR["push / PR"] --> CI["CI: lint, typecheck,<br/>tests, build"]
    CI -->|"merge в main"| IMG["Сборка образов api, caddy<br/>→ GHCR (тег = sha)"]
    IMG --> DEP["SSH на VPS:<br/>compose pull<br/>alembic upgrade head<br/>compose up -d"]
    DEP --> HC["health-check<br/>/api/v1/health"]
    HC -->|"ошибка"| RB["откат на предыдущий тег"]
```

- Миграции выполняются **до** переключения на новый образ: `docker compose run --rm api alembic upgrade head`. Миграции пишутся совместимыми с предыдущей версией кода (expand → contract), чтобы откат образа был безопасен.
- Предыдущий тег хранится в `/opt/zakroma/.previous_tag` для отката.
- Секреты CI: `SSH_HOST`, `SSH_USER`, `SSH_KEY`, токен GHCR.
- Резервный вариант, если реестр недоступен с VPS: `git pull && docker compose build` на сервере (скрипт `deploy/deploy-local-build.sh`).
- Сборка образов и деплой — T-007, T-041; ниже — то, что уже работает.

### 4.1. CI на каждый PR (T-006)

Workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) запускается на PR в `main`, на push в `main` и вручную (Actions → CI → Run workflow). Три задачи идут параллельно:

| Задача (имя проверки) | Что делает | Типичная причина красного |
|---|---|---|
| `pre-commit and secrets` | `pre-commit run --all-files` (ruff, eslint, prettier, YAML/JSON, gitleaks, справочник, `openapi-fresh`, actionlint) и `gitleaks-history` по всей истории | файл не отформатирован (дифф — в логе шага), устарел API-клиент (`pnpm gen:api`), секрет в коммите |
| `backend` | `uv sync --frozen`, `mypy --strict`, `pytest --cov` с интеграционными тестами на Postgres (testcontainers) | упавший тест, покрытие < 80 %, ошибка типов |
| `frontend` | `pnpm install --frozen-lockfile`, `typecheck`, `test:coverage` (≥ 70 %), `build`, `size` (≤ 300 КБ) | упавший тест, покрытие ниже порога, бандл вырос |

Как читать красный прогон: PR → вкладка **Checks** → красная задача → первый красный шаг. Тот же шаг запускается локально той же командой (CLAUDE.md, «Команды»), у всех задач одинаковые версии инструментов: uv 0.13.5, Python из `backend/.python-version`, Node из `frontend/.nvmrc`, pnpm из `packageManager`.

Безопасность CI:

- токен только на чтение (`contents: read`), секретов нет — их и не нужно до деплоя (T-041);
- событие `pull_request` (не `pull_request_target`): PR из форков не получают прав;
- сторонние actions закреплены по SHA на версии старше 7 дней; обновляет Dependabot.

### 4.2. Dependabot (T-006)

[`.github/dependabot.yml`](../.github/dependabot.yml) по понедельникам предлагает обновления (GitHub Actions, uv в `backend/`, npm/pnpm во `frontend/`): minor и patch — одним PR на экосистему, каждый major — отдельно, свежий выпуск — не раньше чем через 7 дней. Каждый PR проходит CI; merge — оператор, после чтения changelog для major.

### 4.3. Настройки репозитория (делает оператор, один раз)

**A. Оповещения и исправления уязвимостей.** Settings → **Advanced Security** (в старом интерфейсе — «Code security and analysis»):

1. **Dependency graph** — Enabled (у публичного репозитория включён по умолчанию).
2. **Dependabot alerts** — Enable.
3. **Dependabot security updates** — Enable: при уязвимости Dependabot сам откроет PR с исправленной версией.

**B. Права Actions.** Settings → Actions → General:

1. **Workflow permissions** — «Read repository contents and packages permissions».
2. «Allow GitHub Actions to create and approve pull requests» — выключено.
3. **Fork pull request workflows** — «Require approval for first-time contributors» (по умолчанию).

**C. Защита `main`** — после первого зелёного прогона CI на PR (до него GitHub не знает имён проверок). Settings → **Rules** → **Rulesets** → New ruleset → **New branch ruleset**:

1. Ruleset name: `main`; Enforcement status: **Active**; Bypass list — пусто.
2. Target branches → Add target → **Include default branch**.
3. Отметить правила:
   - **Restrict deletions**;
   - **Block force pushes**;
   - **Require a pull request before merging**, Required approvals: **0** (оператор один и не может одобрить свой PR; смысл правила — только через PR);
   - **Require status checks to pass** → Add checks: `pre-commit and secrets`, `backend`, `frontend`; включить **Require branches to be up to date before merging** (CI проверяет именно то, что окажется в `main`).
4. **Create**.

Проверка: в PR с красной проверкой кнопка Merge недоступна; прямой `git push` в `main` отклоняется. Если CI сломан не по вине кода (сбой GitHub) — перезапустить задачу (Re-run failed jobs), а не отключать правило.

## 5. Бэкапы (NFR-REL-01/02)

- Ежедневно в 04:00 (время дома): `pg_dump -Fc` → шифрование `age` → выгрузка в S3 с именем `zakroma-YYYY-MM-DD.dump.age`.
- Ротация: 14 ежедневных, 8 еженедельных (воскресенье).
- Ключ расшифровки `age` хранится **вне** VPS (у оператора, в менеджере паролей).
- Ежемесячная проверка (чек-лист в `deploy/backup/RESTORE.md`): скачать последний бэкап → восстановить в локальный контейнер Postgres → проверить число продуктов/партий → записать дату проверки.

## 6. Мониторинг (минимальный)

- Внешний бесплатный пинг `/api/v1/health` раз в 5 минут с уведомлением в Telegram/почту (UptimeRobot или аналог, доступный из РФ).
- `docker compose logs --since 1h api` — первичная диагностика.
- Место на диске — предупреждение в скрипте бэкапа при заполнении > 80 %.

## 7. Локальная разработка

`deploy/docker-compose.dev.yml`: Postgres на `localhost:5432`, backend с `--reload` из исходников, frontend — `pnpm dev` (Vite) с прокси `/api` → `localhost:8000`. Cookie на `localhost` без флага `Secure` (настройка `COOKIE_SECURE=false` только в dev).

Тестовая среда для ручной проверки на телефоне: `pnpm dev --host` в локальной сети; для PWA-функций (service worker требует HTTPS) — проверка на prod/staging-поддомене.
