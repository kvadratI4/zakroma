# 0008. API-клиент frontend генерируется из OpenAPI

- Статус: Accepted
- Дата: 2026-10-23

## Контекст

Backend на Python, frontend на TypeScript. Ручные типы API расходятся с реальностью — частый источник ошибок, особенно при работе с агентом.

## Решение

- FastAPI отдаёт OpenAPI-схему; она экспортируется в `frontend/src/api/openapi.json` скриптом `backend/scripts/export_openapi.py`.
- Типы генерируются `openapi-typescript` в `frontend/src/api/schema.d.ts`; запросы — через `openapi-fetch`.
- CI проверяет, что закоммиченная схема совпадает с текущей схемой backend.

## Реализация (T-005)

- `pnpm gen:api` (из `frontend/`) = `uv run python -m scripts.export_openapi` + `openapi-typescript`; экспорт строит приложение без БД и без `deploy/.env.dev`, JSON с отсортированными ключами — повторный запуск не даёт изменений.
- Актуальность проверяют: тест `backend/tests/unit/test_export_openapi.py` (схема приложения = закоммиченный `openapi.json`), `pnpm api:check` (то же + `schema.d.ts` по `openapi.json`), хук pre-commit `openapi-fresh`; в CI — T-006.
- Ошибки описаны в схеме так, как их отдаёт сервер: `Problem` / `ValidationProblem` в `application/problem+json`, ответ `default` у каждой операции, `422` — только там, где FastAPI валидирует параметры или тело (`app/core/openapi.py`). `operationId` = имя функции маршрута.
- `openapi-typescript` 7 объявляет peer `typescript ^5`; работа с TypeScript 6 проверена и явно разрешена в `frontend/pnpm-workspace.yaml`.

## Последствия

- Изменение API = изменение backend → экспорт схемы → генерация → правка frontend (одна задача).
- Сгенерированные файлы не редактируются вручную (зафиксировано в CLAUDE.md).
