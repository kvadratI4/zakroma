# Диаграммы последовательностей

## 1. Регистрация (без приглашения)

```mermaid
sequenceDiagram
    autonumber
    actor U as Пользователь
    participant S as SPA
    participant A as API
    participant D as DB
    U->>S: email, пароль, имя
    S->>A: POST /auth/register
    A->>A: валидация, argon2id(password)
    A->>D: BEGIN
    A->>D: INSERT users
    A->>D: INSERT households «Мой дом»
    A->>D: INSERT storage_locations ×3 (fridge, freezer, pantry)
    A->>D: INSERT household_members
    A->>D: INSERT sessions (sha256(token), +180 дней)
    A->>D: COMMIT
    A-->>S: 201 {user, households} + Set-Cookie zk_session
    S-->>U: экран «Установите приложение» → Запасы
```

## 2. Приглашение члена семьи

```mermaid
sequenceDiagram
    autonumber
    actor A as Аня (в доме)
    actor B as Борис (новый)
    participant S as SPA
    participant API as API
    participant D as DB
    A->>S: Дом → «Пригласить»
    S->>API: POST /households/{hid}/invites
    API->>D: INSERT household_invites (sha256(token), +7 дней)
    API-->>S: {url}
    S-->>A: Web Share → мессенджер
    A-->>B: ссылка /invite/<token>
    B->>S: открывает ссылку
    S->>API: GET /invites/{token}
    API-->>S: {household_name: «Квартира», invited_by: «Аня»}
    B->>S: регистрируется
    S->>API: POST /auth/register {…, invite_token}
    API->>D: INSERT users, household_members (без создания нового дома), sessions
    API-->>S: 201 + cookie
    S-->>B: Запасы дома «Квартира»
```

## 3. Добавление продукта из справочника (первый раз)

```mermaid
sequenceDiagram
    autonumber
    actor U as Пользователь
    participant S as SPA
    participant A as API
    participant D as DB
    U->>S: вводит «мол»
    S->>A: GET /households/{hid}/products/search?q=мол (debounce 150 мс)
    A->>D: trigram-поиск products ∪ catalog_products
    A-->>S: [Молоко 3,2% (catalog, measures, defaults: холодильник, 1 пакет, ≈ 17.11), …]
    U->>S: выбирает, «Добавить 1 продукт» (значения как в прошлый раз)
    S->>A: POST /households/{hid}/items {items:[{catalog_slug, location_id, measure:"bag", count:1}]}
    A->>D: BEGIN
    A->>D: INSERT products (копия из catalog) ON CONFLICT (household_id, catalog_slug) DO NOTHING
    A->>D: INSERT product_measures (копия мер справочника)
    A->>A: domain: quantity = 1 × мера bag (930), expiry = estimate(purchased_on, shelf_life, location.kind)
    A->>D: INSERT inventory_items
    A->>D: INSERT stock_events (added, +930)
    A->>D: UPDATE products SET default_location_id, last_added_quantity = 930
    A->>D: COMMIT
    A-->>S: 201 {items}
    S->>S: invalidate ['household', hid, 'stock'], ['…','attention']
    S-->>U: тост «Добавлено: молоко, 1 пакет · Отменить»
```

## 4. Списание на уровне продукта (FEFO)

```mermaid
sequenceDiagram
    autonumber
    actor U as Пользователь
    participant S as SPA
    participant A as API
    participant D as DB
    U->>S: Молоко → «Стакан» (мера use 200 мл, необязательное действие)
    S->>S: оптимистично уменьшить в кэше
    S->>A: POST /households/{hid}/products/{pid}/consume {measure:"glass", count:1, reason:"consumed", location_id}
    A->>D: BEGIN, SELECT active items … FOR UPDATE
    A->>A: domain.fefo_plan(items, 200, today) → [(A, 200)]
    loop по каждой партии плана
        A->>D: UPDATE inventory_items SET quantity, version+1, finished_at?
        A->>D: INSERT stock_events (consumed, −x)
    end
    A->>D: COMMIT
    A-->>S: 200 {items, clamped:false}
    S-->>U: тост «Молоко: −стакан · Отменить»
```

## 5. Конфликт версий

```mermaid
sequenceDiagram
    autonumber
    actor A as Аня
    actor B as Борис
    participant API as API
    participant D as DB
    A->>API: GET item (version 3)
    B->>API: GET item (version 3)
    A->>API: PATCH item {quantity: 500, version: 3}
    API->>D: UPDATE … WHERE id=… AND version=3 → 1 строка
    API-->>A: 200 (version 4)
    B->>API: PATCH item {quantity: 700, version: 3}
    API->>D: UPDATE … WHERE id=… AND version=3 → 0 строк
    API-->>B: 409 version_conflict {current: version 4, quantity 500}
    Note over B: SPA показывает актуальные данные и<br/>«Кто-то уже изменил этот продукт»
```

## 6. Чек по QR (S2, черновик)

```mermaid
sequenceDiagram
    autonumber
    actor U as Пользователь
    participant S as SPA
    participant A as API
    participant W as Worker
    participant R as ReceiptProvider
    participant L as LLMProvider
    participant D as DB
    U->>S: сканирует QR чека
    S->>A: POST /households/{hid}/receipts {qr: "t=…&s=…&fn=…&i=…&fp=…"}
    A->>D: дедупликация по fiscal_key, INSERT receipts(status=pending), jobs
    A-->>S: 202 {receipt_id}
    W->>D: взять задание
    W->>R: позиции чека
    R-->>W: [{name_raw, qty, price}]
    W->>D: сопоставления из receipt_name_mappings
    W->>L: несопоставленные строки + список продуктов дома → JSON-предложения
    L-->>W: [{line, product|catalog_slug, quantity, unit, confidence}]
    W->>D: receipt_lines, status=ready
    S->>A: GET /receipts/{id} (опрос)
    A-->>S: позиции + предложения
    U->>S: правит, подтверждает
    S->>A: POST /receipts/{id}/confirm
    A->>D: INSERT inventory_items + stock_events, UPSERT receipt_name_mappings
```

## 7. Рецепт из YouTube (S4, черновик)

```mermaid
sequenceDiagram
    autonumber
    actor U as Пользователь
    participant A as API / Worker
    participant C as video_recipe_cache
    participant Y as YouTube Data API
    participant L as LLMProvider
    U->>A: ссылка на ролик
    A->>C: есть video_id?
    alt есть в кэше
        C-->>A: рецепт
    else нет
        A->>Y: описание ролика
        Y-->>A: title, description
        A->>L: «есть ли рецепт в тексте? → JSON»
        alt рецепт найден
            L-->>A: ингредиенты, шаги
        else нет
            A->>L: анализ видео мультимодальной моделью
            L-->>A: ингредиенты, шаги
        end
        A->>C: сохранить
    end
    A->>A: сопоставить ингредиенты с продуктами дома
    A-->>U: черновик рецепта на проверку
```
