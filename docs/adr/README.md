# Architecture Decision Records

Каждое значимое решение — отдельный файл `NNNN-kebab-name.md` по [шаблону](../../templates/ADR.md). Решения не переписываются: если решение меняется, создаётся новый ADR со статусом `Accepted`, а старый получает статус `Superseded by NNNN`.

Когда нужен ADR: выбор библиотеки/сервиса, изменение схемы данных с последствиями, отказ от требования, изменение процесса. Агент **предлагает** ADR в разделе «Предложение» задачи; оператор принимает.

| № | Решение | Статус |
|---|---|---|
| [0001](0001-record-decisions.md) | Фиксировать решения в ADR | Accepted |
| [0002](0002-hosting-ru-vps-docker-compose.md) | Хостинг: российский VPS + Docker Compose вместо GitHub Pages / BaaS | Accepted |
| [0003](0003-stack-pwa-react-fastapi-postgres.md) | Стек: PWA (React+TS) + FastAPI + PostgreSQL | Accepted |
| [0004](0004-auth-simple-sessions.md) | Авторизация: email+пароль, серверные сессии, приглашения и сброс по ссылкам | Accepted |
| [0005](0005-inventory-batches-and-event-log.md) | Запасы: партии + неизменяемый журнал событий | Accepted |
| [0006](0006-quantity-levels-thresholds.md) | Количество: базовые единицы, режим «уровень», 4 порога | Accepted, частично заменён 0013 |
| [0007](0007-household-products-from-catalog.md) | Продукты дома копируются из глобального справочника при первом использовании | Accepted |
| [0008](0008-generated-api-client.md) | API-клиент frontend генерируется из OpenAPI | Accepted |
| [0009](0009-agent-workflow-tdd.md) | Процесс: предложение → вопросы → ответы → TDD-реализация | Accepted |
| [0010](0010-llm-provider.md) | Выбор LLM-провайдера для S2–S4 | Proposed (решить до S2) |
| [0011](0011-test-db-isolation.md) | Изоляция тестов БД: транзакция с откатом на тест | Accepted |
| [0012](0012-prod-stack-least-privilege.md) | Prod-стек с минимальными правами: роли БД, сети, CSP | Accepted |
| [0013](0013-presence-tracking-household-measures.md) | Учёт наличия: бытовые меры, норма дома, отметка главнее расчёта | Accepted |
