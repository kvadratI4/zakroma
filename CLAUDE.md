# CLAUDE.md — инструкция для агента

Ты работаешь над **«Закрома»** — семейным PWA, которое показывает, **что есть дома, чего нет и что пора купить** (где лежит, примерно сколько, до какого срока; предупреждения «закончилось / почти нет / мало / избыток / скоро испортится»). Пользователи — семья оператора, включая пожилых людей и подростков. Главный риск проекта — люди перестанут вести учёт, поэтому простота ввода важнее функций.

## Ценности продукта (подробно — [docs/01-vision.md](docs/01-vision.md))

1. **Наличие важнее потребления**: знать, что есть и чего нет, а не кто сколько съел; учёт верен, даже если отмечают только «закончилось» и «купили».
2. **Учёт следует быту**: бытовые меры (пачка, стакан, ложка, ломтик, банка), повторяющиеся покупки, «как в прошлый раз».
3. **Для всех поколений**: крупно, понятными словами, видимыми кнопками.
4. **Приложение предлагает — человек подтверждает**: место, количество, срок, меры подставляются сами.
5. **Дешевле, чем жить без учёта**: 1–2 нажатия на действие.
6. **Честность**: примерное помечено «≈».

Перед любым решением задай вопросы оператора: *удобно ли это старшим? будет ли человек делать это в обычной жизни? упростит ли это ему жизнь?* (L-038).

Стек: React + TypeScript (strict) + Vite + Tailwind + TanStack Query (PWA) · Python 3.12+ + FastAPI + SQLAlchemy 2 async + Alembic · PostgreSQL · Docker Compose на VPS в РФ. Подробно — [docs/03-architecture.md](docs/03-architecture.md).

## Всегда в контексте

@docs/agent/LESSONS.md
@docs/agent/GLOSSARY.md

## Как мы работаем (обязательно)

Процесс — [docs/agent/WORKFLOW.md](docs/agent/WORKFLOW.md). Кратко:

1. **Задача** берётся только из [docs/BACKLOG.md](docs/BACKLOG.md) со статусом `Ready`. Её файл — `tasks/T-xxx.md` (создай из `templates/TASK.md`, если нет).
2. **Предложение и вопросы** (`/task-start`): прочитай задачу, связанные требования, доменные правила, ADR. Заполни раздел «Предложение» и «Вопросы». **ОСТАНОВИСЬ и жди ответа оператора.** Не пиши код и тесты на этом шаге.
3. **Ответы** оператора запиши в файл задачи дословно или близко к тексту.
4. **Реализация по TDD** (`/task-implement`): сначала тесты → запусти и покажи, что они падают по правильной причине → минимальный код → рефакторинг. Тест не меняется ради прохождения без согласия оператора.
5. **Завершение** (`/task-finish`): Definition of Done из WORKFLOW, обновление документации, статус в BACKLOG → `Review`, уроки.

Если в ходе реализации выясняется, что нужно изменить API-контракт, схему БД, доменное правило или добавить зависимость — **остановись, спроси и объясни необходимость изменения**. Мелкие решения (имена, внутренняя структура) принимай сам и записывай в раздел «Решения» файла задачи.

Замечание оператора, которое стоит помнить дольше одной задачи («не делай так», «всегда делай так») → запиши через `/lesson` в `docs/agent/LESSONS.md` (не только в свою авто-память: уроки проекта должны быть в репозитории). Правила по областям кода — в `.claude/rules/` (подгружаются при работе с файлами области).

## Общение

- С оператором — по-русски, кратко, по делу. Вопросы — пронумерованным списком, у каждого варианты и твоя рекомендация с причиной.
- Код, комментарии, имена, сообщения коммитов — по-английски. Тексты интерфейса — только через i18n-ресурсы (`frontend/src/i18n/ru/*.json`).
- Не пересказывай сделанное длинно: итог задачи — в файле задачи, в чат — 3–6 строк.

## Архитектурные правила (нарушение = ошибка ревью)

1. **`backend/app/domain` — чистый**: не импортирует FastAPI, SQLAlchemy, httpx; не читает часы и сеть. «Сегодня» и время передаются параметрами (`Clock` в сервисах).
2. **Количества — `Decimal`, в базовой единице продукта** (`g`/`ml`/`pcs`). Никаких `float` в логике количеств и денег.
3. **Изоляция домов**: любой запрос к данным дома фильтруется по `household_id` из `HouseholdContext`; новый маршрут `/households/{hid}/…` добавляется в реестр общей фикстуры проверок доступа (401/404).
4. **Изменение запасов = изменение партии + событие журнала в одной транзакции.** `stock_events` только дополняется.
5. **Оптимистичная блокировка**: изменяемые сущности обновляются с `WHERE version = :v`; 0 строк → `409 version_conflict` с актуальным состоянием.
6. **Ошибки API** — `application/problem+json` со стабильным `code`; frontend переводит `code` через i18n.
7. **API-клиент frontend генерируется** из OpenAPI; файлы `frontend/src/api/schema.d.ts` и `openapi.json` руками не редактируются.
8. **Доменные правила** — источник истины [docs/05-domain-rules.md](docs/05-domain-rules.md). Сначала меняется документ (с согласия оператора), потом тест, потом код.
9. **Миграции** — только Alembic, только вперёд; применённую миграцию не редактировать. После изменения схемы обновить `docs/db/schema.sql` (дамп реальной БД); проект ещё не реализованных таблиц — `docs/db/schema_design.sql`, его не терять.
10. **Секреты** — только в `.env` на сервере; во frontend и в репозитории их нет.

## Команды

> Заполняются по мере создания каркаса (T-001…T-007). Агент, выполнивший задачу каркаса, обновляет этот раздел.

```bash
# pre-commit (после T-001): установка один раз на машину и на клон
uv tool install pre-commit && uv tool update-shell   # затем перезапустить терминал
pre-commit install                                  # хуки на git commit в этом клоне
pre-commit run --all-files                          # проверить весь репозиторий (то же делает CI, T-006: .github/workflows/ci.yml)
pre-commit run gitleaks-history --hook-stage manual --all-files   # секреты во всей истории git (без --all-files хук пропускается, если индекс пуст)

# backend (T-002, T-003); интеграционным тестам нужен запущенный Docker
cd backend && uv sync                           # зависимости (Python 3.13, uv.lock)
cd backend && uv run python scripts/init_dev_env.py   # один раз: deploy/.env.dev со случайным паролем БД (не читать, не коммитить)
docker compose -f deploy/docker-compose.dev.yml up -d --wait   # dev Postgres 18 на 127.0.0.1:5432
cd backend && uv run uvicorn app.main:create_app --factory --reload   # dev-сервер :8000
cd backend && uv run pytest                     # все тесты
cd backend && uv run pytest tests/unit -q       # быстрые доменные
cd backend && uv run pytest --cov --cov-report=term-missing   # покрытие (порог 80 %)
cd backend && uv run ruff check . && uv run ruff format --check . && uv run mypy app tests scripts alembic
cd backend && uv run alembic upgrade head      # миграции dev-БД
cd backend && uv run alembic revision --autogenerate -m "what"   # новая ревизия (имя файла YYYYMMDD_HHMM_what)
cd backend && uv run alembic check             # модели = миграции
# после изменения схемы — пересоздать docs/db/schema.sql (команда в шапке файла)
# логи в dev читаемым текстом: LOG_FORMAT=console (по умолчанию JSON)

# frontend (T-004): Node 24 LTS + pnpm 12 на машине; в терминале агента — по явному пути (L-016):
#   export PATH="/c/Program Files/nodejs:$(cygpath -u "$APPDATA")/npm:$PATH"
cd frontend && pnpm install --frozen-lockfile    # зависимости по pnpm-lock.yaml
cd frontend && pnpm dev                          # dev-сервер http://127.0.0.1:5173; /api → backend на 127.0.0.1:8000
cd frontend && pnpm test && pnpm lint && pnpm typecheck && pnpm format:check
cd frontend && pnpm test:coverage                # тесты + пороги покрытия 70 % (как в CI)
cd frontend && pnpm build && pnpm size           # сборка + JS первого экрана ≤ 300 КБ gzip
cd frontend && pnpm preview                      # собранная версия на http://127.0.0.1:4173
# стиль: docs/10-design.md; цвета — только из src/shared/theme/tokens.ts
# API-клиент (T-005, ADR-0008): после любого изменения API backend — перегенерировать и закоммитить
cd frontend && pnpm gen:api                     # backend → src/api/openapi.json → src/api/schema.d.ts (без БД и .env.dev)
cd frontend && pnpm api:check                   # схема и типы актуальны (то же — хук openapi-fresh и тест pytest)

# справочник (на Windows — `python` или `py`: `python3` там заглушка Microsoft Store)
python3 docs/catalog/validate_catalog.py

# prod-сборка локально (T-007, docs/09-deployment.md §2.3): https://127.0.0.1:8443
cd backend && uv run python scripts/init_prod_env.py --site-address 127.0.0.1   # один раз: deploy/.env (не читать, не коммитить)
docker compose -f deploy/docker-compose.yml up -d --build --wait               # весь стек, без имени сервиса
docker compose -f deploy/docker-compose.yml cp caddy:/data/caddy/pki/authorities/local/root.crt caddy-root.crt
cd backend && ZAKROMA_SMOKE_URL=https://127.0.0.1:8443 ZAKROMA_SMOKE_CA=../caddy-root.crt ZAKROMA_SMOKE_COMPOSE_FILE=../deploy/docker-compose.yml uv run pytest tests/smoke
docker compose -f deploy/docker-compose.yml down                                # остановить (-v — удалить данные)
# никогда: `docker compose config` без --images — печатает пароли
```

## Карта документации

| Нужно | Где |
| --- | --- |
| Что и зачем | [docs/01-vision.md](docs/01-vision.md), [docs/02-requirements.md](docs/02-requirements.md) |
| Как устроено | [docs/03-architecture.md](docs/03-architecture.md), [docs/adr/](docs/adr/) |
| Данные | [docs/04-data-model.md](docs/04-data-model.md), [docs/db/schema.sql](docs/db/schema.sql) (факт), [docs/db/schema_design.sql](docs/db/schema_design.sql) (проект) |
| Логика количеств, порогов, сроков | [docs/05-domain-rules.md](docs/05-domain-rules.md) |
| Контракт API | [docs/06-api.md](docs/06-api.md) |
| Экраны | [docs/07-ui-ux.md](docs/07-ui-ux.md), стиль — [docs/10-design.md](docs/10-design.md) |
| Тесты | [docs/08-testing.md](docs/08-testing.md) |
| Деплой | [docs/09-deployment.md](docs/09-deployment.md) |
| Стиль кода, git | [docs/agent/CONVENTIONS.md](docs/agent/CONVENTIONS.md) |
| Статус проекта (сводки каждые 5 задач и по этапам) | [docs/status/](docs/status/README.md) |

Читай только то, что нужно для текущей задачи: файл задачи указывает ссылки.

## Нельзя без явного разрешения оператора

- добавлять зависимости (Python/JS) и внешние сервисы;
- менять API-контракт, схему БД, доменные правила, принятые ADR;
- менять или удалять существующие тесты (кроме очевидной ошибки в самом тесте — с пояснением);
- менять статус чужих задач в BACKLOG, брать следующую задачу самостоятельно;
- `git push`, работа с `main` напрямую, переписывание истории;
- читать или выводить содержимое `.env` и секретов.
