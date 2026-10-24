---
description: Write a project status report into docs/status/ (every 5 Done tasks and at the end of each stage). Use when the operator runs /status-report or when /task-start finds a report is due.
argument-hint: [повод, optional]
disable-model-invocation: true
---

# /status-report $ARGUMENTS

Сводка — память проекта о его состоянии (правило оператора, 2026-10-24; WORKFLOW, «Сводки статуса»).

1. Определи номер и повод: последний файл в `docs/status/`, число задач `Done` в `docs/BACKLOG.md`, закрытые этапы.
2. Собери факты, не по памяти: `git log main`, BACKLOG (сводка и статусы), «Итоги» файлов задач с прошлой сводки, `docs/agent/LESSONS.md`, свежий прогон тестов (числа тестов, покрытие, размер бандла).
3. Заполни `templates/STATUS.md` → `docs/status/NN-<повод>.md`. Пункт 5 — **независимая оценка**: перечитай код и документы как ревьюер со стороны (секреты, сеть и порты, зависимости и цепочка поставки, обработка ошибок, слои, ADR ↔ код, документы ↔ код ↔ UI), называй риски прямо, с предложением к каждому.
4. Мелкие расхождения документов (устаревшая строка, опечатка) исправь сразу и перечисли в сводке; всё крупнее — в «Предложения оператору».
5. Добавь строку в индекс `docs/status/README.md`. Коммит `docs: status report NN`.
6. В чат: 5–8 строк сути + предложения пронумерованным списком.
