# 0008. API-клиент frontend генерируется из OpenAPI

- Статус: Accepted
- Дата: 2026-10-23

## Контекст

Backend на Python, frontend на TypeScript. Ручные типы API расходятся с реальностью — частый источник ошибок, особенно при работе с агентом.

## Решение

- FastAPI отдаёт OpenAPI-схему; она экспортируется в `frontend/src/api/openapi.json` скриптом `backend/scripts/export_openapi.py`.
- Типы генерируются `openapi-typescript` в `frontend/src/api/schema.d.ts`; запросы — через `openapi-fetch`.
- CI проверяет, что закоммиченная схема совпадает с текущей схемой backend.

## Последствия

- Изменение API = изменение backend → экспорт схемы → генерация → правка frontend (одна задача).
- Сгенерированные файлы не редактируются вручную (зафиксировано в CLAUDE.md).
