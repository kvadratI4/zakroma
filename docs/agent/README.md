# Работа с агентом

| Файл | Для кого | Что |
|---|---|---|
| [OPERATOR_GUIDE.md](OPERATOR_GUIDE.md) | оператор | Как вести сессии, давать замечания, принимать работу |
| [WORKFLOW.md](WORKFLOW.md) | оба | Жизненный цикл задачи, DoR/DoD, уроки, git |
| [LESSONS.md](LESSONS.md) | агент (авто) | Накопленные правила «не наступать дважды» |
| [GLOSSARY.md](GLOSSARY.md) | агент (авто) | Термины: UI ↔ документация ↔ код |
| [CONVENTIONS.md](CONVENTIONS.md) | агент | Стиль кода, имена, git |

Конфигурация Claude Code:

| Путь | Что |
|---|---|
| `CLAUDE.md` | Главная инструкция; импортирует LESSONS и GLOSSARY |
| `.claude/settings.json` | Разрешения: что можно без спроса, что с вопросом, что запрещено |
| `.claude/rules/*.md` | Правила по областям (backend, frontend, БД, тесты), грузятся при работе с файлами этих областей |
| `.claude/skills/*/SKILL.md` | Команды процесса: `/next-task`, `/task-start`, `/task-implement`, `/task-finish`, `/lesson` |
| `templates/` | Шаблоны задачи, ADR, урока |
| `tasks/` | Файлы задач — история обсуждений и решений |
