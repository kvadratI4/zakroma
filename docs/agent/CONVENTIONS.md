# Соглашения по коду

## Общие

- Язык кода, имён, комментариев, коммитов — английский. Документация и UI — русский.
- Комментарий объясняет **почему**, а не что. Ссылки на правила: `# see docs/05-domain-rules.md §5.3`.
- Нет мёртвого кода, закомментированных блоков, `TODO` без ID задачи (`TODO(T-302): …`).
- Форматирование — автоматическое (ruff format, prettier); спорить о стиле не нужно.

## Python (backend)

| Что | Правило |
|---|---|
| Версия | 3.12+ |
| Форматирование, линт | `ruff format`, `ruff check` (правила: E, F, I, B, UP, SIM, RUF, ASYNC, S) |
| Типы | `mypy --strict`; Pydantic v2 модели для API |
| Имена | модули `snake_case`, классы `PascalCase`, функции — глаголы (`plan_fefo_consumption`) |
| Схемы API | `XxxCreate`, `XxxUpdate`, `XxxOut` в `api/v1/<resource>/schemas.py` |
| Ошибки | исключения `AppError(code=…, status=…)` в `core/errors.py` |
| Деньги/количества | `Decimal`, квантование `Decimal("0.001")` |
| Даты | `date` для сроков, `datetime` с tzinfo для моментов |

## TypeScript (frontend)

| Что | Правило |
|---|---|
| Режим | `strict: true`, `noUncheckedIndexedAccess: true` |
| Линт | eslint (typescript-eslint, react-hooks, jsx-a11y), prettier |
| Компоненты | функциональные, `PascalCase.tsx`, один экспортируемый компонент на файл |
| Хуки | `useXxx`, запросы — `features/<f>/api.ts` (`useStockQuery`, `useConsumeMutation`) |
| Стили | Tailwind; токены цветов уровней — в одном месте (`shared/ui/level.ts`) |
| i18n-ключи | `<feature>.<area>.<name>` |

## Git

- Ветки `t-xxx-short-name`; коммиты — Conventional Commits; тело — `Refs: T-xxx`.
- PR-описание: что сделано, ссылки на критерии приёмки и тесты, изменённые документы, скриншот для UI.

## Файлы задач

- `tasks/T-xxx.md` из `templates/TASK.md`; не удалять после `Done` — это история решений.
