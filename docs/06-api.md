# 06. API (v1)

Базовый путь: `/api/v1`. Формат: JSON. Ошибки: `application/problem+json` (см. [архитектуру](03-architecture.md#ошибки)). Авторизация: cookie `zk_session`. Источник истины после реализации — OpenAPI-схема (`/api/v1/openapi.json`); этот документ — проектный контракт, который задача обязана либо соблюсти, либо явно изменить.

Соглашения:

- Количества — в базовой единице продукта (`g`/`ml`/`pcs`), числами JSON с не более чем 3 знаками после запятой (на backend — `Decimal`, без `float`). Ввод в бытовых мерах — парой `{measure, count}` («2 пакета»), сервер переводит в базовую единицу ([05 §1.1](05-domain-rules.md#11-бытовые-меры)).
- Модель — учёт наличия ([ADR-0013](adr/0013-presence-tracking-household-measures.md)): главные изменяющие запросы — отметка уровня, «Закончилось» и добавление; записи «съели» с количеством необязательны.
- Даты — `YYYY-MM-DD`, моменты — ISO 8601 с часовым поясом.
- Изменяемые сущности возвращают `version`; `PATCH` требует `version` в теле, иначе `409 version_conflict` с актуальным состоянием в `current`.
- Списки — `?limit=&cursor=` (курсорная пагинация) там, где данных может быть много (события).
- Все пути `/households/{hid}/…` требуют членства в доме, иначе `404` (не `403` — не раскрываем существование дома).
- Каждый ответ содержит заголовок `X-Request-ID` (он же — `request_id` в логах). Входящий `X-Request-ID` (от Caddy) сохраняется, если он вида `[A-Za-z0-9._-]{1,64}`, иначе сервер генерирует свой.

### Ошибки

Тело — RFC 9457 `application/problem+json`: `type` (`https://zakroma/errors/<code-через-дефис>`), `title` (русский текст-заглушка; UI переводит `code` через i18n), `status`, `code`, необязательный `detail` и дополнительные поля конкретной ошибки (например, `current` у `409 version_conflict`).

| Статус | `code` | Когда |
|---|---|---|
| 404 | `not_found` | нет такого пути / сущности (в т.ч. чужой дом) |
| 405 | `method_not_allowed` | метод не поддерживается; заголовок `Allow` |
| 422 | `validation_error` | тело/параметры не прошли проверку; поле `errors: [{loc, type, msg}]` — `loc` как в pydantic (`["body", "password"]`), `type` — машинный тип (`missing`, `string_too_short`…), `msg` — английский текст для отладки. **Введённые значения не возвращаются.** |
| 413 | `payload_too_large` | тело запроса ≥ 1 000 000 байт; отвечает Caddy, до api запрос не доходит (T-007) |
| 500 | `internal_error` | непредвиденная ошибка; деталей в ответе нет, трассировка — в логе по `X-Request-ID` |
| … | свой `code` | ошибки сценариев (`email_taken`, `version_conflict`, `unit_mismatch`, `invalid_quantity` …) — описаны у маршрутов |

В OpenAPI-схеме тело ошибки — `Problem` (дополнительные поля разрешены), у `422` — `ValidationProblem`; у каждой операции есть ответ `default` (`application/problem+json`), ошибки сценариев объявляются у маршрута (`problem_response` в `app/core/openapi.py`). `operationId` — имя функции маршрута.

## Аутентификация

| Метод | Путь | Тело / параметры | Ответ | Требования |
|---|---|---|---|---|
| POST | `/auth/register` | `{email, password, display_name, invite_token?}` | `201 {user, households}` + cookie | FR-AUTH-01, FR-HH-01, FR-HH-03 |
| POST | `/auth/login` | `{email, password}` | `200 {user, households}` + cookie | FR-AUTH-02, FR-AUTH-06 |
| POST | `/auth/logout` | — | `204` | FR-AUTH-03 |
| GET | `/auth/me` | — | `200 {user, households, last_household_id}` | — |
| PATCH | `/auth/me` | `{display_name?, last_household_id?, revision_reminder_days?}` (`7\|14\|21\|28\|null`) | `200 {user}` | FR-AUTH-04, FR-INV-13 |
| POST | `/auth/me/password` | `{current_password, new_password}` | `204` | FR-AUTH-04 |
| GET | `/auth/password-reset/{token}` | — | `200 {email, display_name}` / `404` | FR-AUTH-05 |
| POST | `/auth/password-reset/{token}` | `{new_password}` | `204` (все сессии завершены) | FR-AUTH-05 |

Коды ошибок: `email_taken`, `invalid_credentials`, `too_many_attempts`, `weak_password`, `invite_invalid`, `reset_token_invalid`.

## Дома и участники

| Метод | Путь | Тело / параметры | Ответ | Требования |
|---|---|---|---|---|
| GET | `/households` | — | `200 [household]` | FR-HH-06 |
| POST | `/households` | `{name}` | `201 household` (с местами по умолчанию) | FR-HH-07 |
| GET | `/households/{hid}` | — | `200 household` | — |
| PATCH | `/households/{hid}` | `{name?, expiring_days?, timezone?, version}` | `200 household` | FR-HH-05, FR-VIEW-04 |
| GET | `/households/{hid}/members` | — | `200 [member]` | — |
| DELETE | `/households/{hid}/members/me` | — | `204` (покинуть дом) | FR-HH-05 |
| POST | `/households/{hid}/members/{uid}/password-reset` | — | `201 {url, expires_at}` | FR-AUTH-05 |
| GET | `/households/{hid}/invites` | — | `200 [invite]` (активные) | FR-HH-02 |
| POST | `/households/{hid}/invites` | — | `201 {id, url, expires_at}` | FR-HH-02 |
| DELETE | `/households/{hid}/invites/{id}` | — | `204` (отзыв) | FR-HH-02 |
| GET | `/invites/{token}` | — (без авторизации) | `200 {household_name, invited_by}` / `404` | FR-HH-03 |
| POST | `/invites/{token}/accept` | — (авторизован) | `200 household` | FR-HH-03 |

## Места хранения

| Метод | Путь | Тело | Ответ | Требования |
|---|---|---|---|---|
| GET | `/households/{hid}/locations` | — | `200 [location]` | FR-LOC-01 |
| POST | `/households/{hid}/locations` | `{name, kind, sort_order?}` | `201 location` | FR-LOC-01 |
| PATCH | `/households/{hid}/locations/{id}` | `{name?, kind?, sort_order?, version}` | `200 location` | FR-LOC-01/02 |
| POST | `/households/{hid}/locations/{id}/checked` | — | `200 location` (`checked_at = now`; «Остальное на месте») | FR-INV-12 |
| GET | `/households/{hid}/revision` | — | `200 {suggest, last_revision_on, period_days, places:[{location_id, checked_at}], since_last:{out:[product], low:[product]}}` ([05 §9.2](05-domain-rules.md#92-предложение-ревизии)) | FR-INV-13 |
| POST | `/households/{hid}/revision/snooze` | — | `204` («Не сейчас»: `revision_snoozed_until = now + период` пользователя) | FR-INV-13 |
| DELETE | `/households/{hid}/locations/{id}` | — | `204` / `409 location_not_empty` | FR-LOC-03 |

## Справочник и продукты дома

| Метод | Путь | Тело / параметры | Ответ | Требования |
|---|---|---|---|---|
| GET | `/catalog/categories` | — | `200 [category]` | FR-CAT-01 |
| GET | `/catalog/measures` | — | `200 [{slug, one, few, many, gen, halves}]` — словарь бытовых мер | FR-CAT-06 |
| GET | `/households/{hid}/products/search` | `?q=&limit=10` | `200 [{kind: "product"\|"catalog", id\|slug, name, category, unit, tracking_mode, measures, defaults}]` — `defaults` = «как в прошлый раз» (§ ниже) | FR-CAT-03, FR-INV-03 |
| GET | `/households/{hid}/products` | `?category=&archived=false` | `200 [product]` | — |
| POST | `/households/{hid}/products` | `{catalog_slug}` **или** `{name, category, unit, tracking_mode, …}` | `201 product` (если из справочника и уже есть — `200` существующий) | FR-CAT-02 |
| GET | `/households/{hid}/products/{pid}` | — | `200 product + summary + items` | FR-VIEW-05 |
| PATCH | `/households/{hid}/products/{pid}` | поля продукта (в том числе норма дома `keep_in_stock` + `low_below` и `measures: [{role, measure, amount}]` целиком) + `version` | `200 product` | FR-CAT-04, 06, 07 |
| POST | `/households/{hid}/products/{pid}/archive` | — | `204` / `409 product_has_items` | FR-CAT-05 |
| GET | `/households/{hid}/products/frequent` | `?limit=12` | `200 [product + defaults]` — «Обычно покупаете» (по числу событий `added` за 90 дней) | FR-INV-03 |

`defaults` — значения для добавления ([05 §8](05-domain-rules.md#8-значения-по-умолчанию-при-добавлении-как-в-прошлый-раз)):

```json
{ "location_id": "…", "measure": "bag", "count": 2, "quantity": 1860,
  "expires_on": "2026-11-17", "expiry_source": "estimated" }
```

`product` содержит `measures: [{role: "buy"|"use", measure, amount}]`, пороги `critical_below, low_below, plenty_from, excess_from`, `keep_in_stock` (норма дома — вместе с `low_below`), `default_location_id`, `last_added_quantity`, сроки хранения, `version`.

## Запасы

### Чтение

| Метод | Путь | Параметры | Ответ | Требования |
|---|---|---|---|---|
| GET | `/households/{hid}/stock` | `?location=&category=&status=&q=&group=location\|category` | `200 [product_summary]` | FR-VIEW-01/02 |
| GET | `/households/{hid}/attention` | — | `200 {expired:[item], expiring:[item], out:[summary], critical:[summary], low:[summary], excess:[summary]}` — уровни только у продуктов с нормой дома ([05 §6](05-domain-rules.md#6-сроки-и-покупки)) | FR-VIEW-03 |
| GET | `/households/{hid}/events` | `?product_id=&limit=&cursor=` | `200 {items:[event], next_cursor}` | FR-INV-10 |

`product_summary` (`level_hint` — подсказка в мерах при уровнях `critical`/`low`, например `{"measure": "packet", "approx": 5}` или `{"measure": "glass", "less_than": true}`, [05 §1.2](05-domain-rules.md#12-подсказка-в-мерах)):

```json
{
  "product": { "id": "…", "name": "Макароны (паста)", "unit": "g", "category": "pasta",
               "tracking_mode": "exact", "keep_in_stock": true,
               "measures": [ { "role": "buy", "measure": "pack", "amount": 450 } ] },
  "total_quantity": 1350, "total_is_approx": false, "total_is_partial": false,
  "level": "normal",
  "level_hint": null,
  "nearest_expiry": { "date": "2027-03-01", "source": "package", "status": "ok" },
  "items": [ { "id": "…", "location_id": "…", "quantity": 900, "quantity_is_approx": false,
               "level": null, "effective_level": "normal",
               "purchased_on": "2026-10-20", "expires_on": "2027-03-01",
               "expiry_source": "package", "effective_expiry": "2027-03-01",
               "expiry_status": "ok", "opened_on": null, "version": 3 } ]
}
```

### Изменение

| Метод | Путь | Тело | Ответ | Требования |
|---|---|---|---|---|
| POST | `/households/{hid}/items` | `{items: [{product_id \| catalog_slug, location_id?, measure?, count?, quantity?, input_unit?, quantity_is_approx?, level?, purchased_on?, expires_on?}]}` | `201 {items:[item]}` — все или ничего; один запрос и для одного продукта, и для списка «после магазина» | FR-INV-01..04 |
| PATCH | `/households/{hid}/items/{id}` | `{quantity?, level?, expires_on?, purchased_on?, version}` | `200 item` (событие `adjusted`/`level_set`) | FR-INV-09, FR-INV-11 |
| POST | `/households/{hid}/items/{id}/consume` | `{amount? \| measure+count? \| all?, reason: "consumed"\|"discarded", version}` | `200 {item, clamped}` | FR-INV-05 |
| POST | `/households/{hid}/items/{id}/open` | `{opened_on?, version}` | `200 item` | FR-INV-07 |
| POST | `/households/{hid}/items/{id}/move` | `{to_location_id, amount?, version}` | `200 {from_item, to_item}` | FR-INV-08 |
| POST | `/households/{hid}/items/{id}/level` | `{level, quantity?, version}` | `200 item` | FR-INV-06 |
| POST | `/households/{hid}/products/{pid}/mark` | `{location_id, level, quantity?}` | `200 {items:[item]}` — отметка наличия продукта в месте ([05 §3.6](05-domain-rules.md#36-отметка-наличия)); `level: "out"` = «Закончилось» | FR-INV-05, 06 |
| POST | `/households/{hid}/products/{pid}/consume` | `{amount \| measure+count \| all, reason, location_id?}` | `200 {items:[item], clamped}` — FEFO; `all` + `reason: "discarded"` = «Выбросить» всё в месте | FR-INV-05 |

Пояснения:

- `measure: "bag", count: 2` при добавлении = `quantity = 2 × amount` меры продукта; мера должна быть у продукта, `count` — кратно ½ и только у мер с `halves`, для штучных — целый результат, иначе `422 invalid_quantity`.
- Без `location_id`, количества и срока сервер подставляет значения «как в прошлый раз» ([05 §8](05-domain-rules.md#8-значения-по-умолчанию-при-добавлении-как-в-прошлый-раз)) и обновляет `default_location_id`, `last_added_quantity` продукта.
- `input_unit` (`kg`, `l` …) — сервер переводит в базовую; несовместимая единица → `422 unit_mismatch`.
- «½ пачки» = `measure: "pack", count: 0.5`; «−стакан» = `measure: "glass", count: 1`.
- `mark` с `quantity`, когда в месте больше одной партии, → `422 quantity_needs_single_item`.
- Изменяющие запросы запасов принимают необязательное `source: "check"` — отметка сделана при проверке места или ревизии (05 §9.3).
- Перемещение части партии создаёт новую партию в целевом месте с теми же датами.

## Служебное

| Метод | Путь | Ответ |
|---|---|---|
| GET | `/health` | `200 {status: "ok", db: "ok"}`; БД недоступна или не ответила за 5 с → `503` problem+json `db_unavailable` (без деталей подключения) |
| GET | `/openapi.json` | схема — кроме `ENVIRONMENT=prod` (с T-007; решение оператора 2026-10-24) |
| GET | `/docs` | Swagger UI — кроме `ENVIRONMENT=prod` |

## Будущие этапы (черновик, уточняется в задачах)

| Этап | Ресурсы |
|---|---|
| S2 | `GET /households/{hid}/barcodes/{code}`, `POST /households/{hid}/barcodes`, `POST /households/{hid}/receipts` (QR-строка или фото) → задание; `GET /households/{hid}/receipts/{id}` (позиции + сопоставления + `defaults` по каждой: место, количество, срок), `POST /households/{hid}/receipts/{id}/confirm` → тот же `POST …/items` списком |
| S3 | `/households/{hid}/recipes`, `/households/{hid}/recipes/suggestions`, `/households/{hid}/shopping-list` |
| S4 | `POST /households/{hid}/recipes/import-youtube`; поля `runs_out` («на сколько хватит») и `waste_share` (доля выброшенного) в `product_summary` ([05 §7](05-domain-rules.md#7-оценка-расхода-и-выброшенного-s4)) |
