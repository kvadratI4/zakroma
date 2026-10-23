---
description: Show project status and suggest which Ready backlog tasks can be started next. Use when the operator runs /next-task or asks what to do next.
disable-model-invocation: true
---

# /next-task

1. Прочитай `docs/BACKLOG.md`.
2. Покажи:
   - задачу в `Proposal` / `In progress` / `Review` / `Blocked`, если есть (и что в ней дальше — по журналу в `tasks/T-xxx.md`);
   - до 3 задач `Ready`, у которых все зависимости `Done`, в порядке BACKLOG; для каждой — одна строка «что даст» и размер.
3. Если есть задача в работе — напомни о WIP-лимите 1 и предложи сначала закончить её.
4. Ничего не меняй в файлах. Не начинай задачу сам — оператор запускает `/task-start T-xxx`.
