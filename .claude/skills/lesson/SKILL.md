---
description: Record a lesson from operator feedback or a discovered pitfall into docs/agent/LESSONS.md so future sessions do not repeat it. Use when the operator runs /lesson or explicitly says to remember something.
argument-hint: [что запомнить — свободным текстом]
disable-model-invocation: true
---

# /lesson $ARGUMENTS

1. Сформулируй урок по шаблону `templates/LESSON.md`: **правило в повелительном наклонении** («Делай / Не делай …»), короткое «почему» и источник (задача/дата). Если `$ARGUMENTS` пуст — возьми последнее замечание оператора из диалога.
2. Определи раздел в `docs/agent/LESSONS.md` (Процесс, Backend, Frontend, Данные/БД, Тесты, UX, Окружение/деплой).
3. Проверь дубликаты и противоречия с существующими уроками:
   - похожий урок есть → уточни его формулировку, а не добавляй второй;
   - противоречит → покажи оба и спроси, какой оставить.
4. Покажи оператору итоговую формулировку одной строкой. После «ок» — запиши, присвоив следующий номер `L-NNN`, и отметь в журнале текущей задачи.
5. Если урок касается только одной части кода и длинный (несколько шагов) — предложи вместо урока правило в `.claude/rules/<area>.md`.

Держи `LESSONS.md` коротким (он загружается в каждую сессию): если файл больше ~150 строк — предложи оператору объединить или перенести устаревшие уроки в `docs/agent/LESSONS_ARCHIVE.md`.
