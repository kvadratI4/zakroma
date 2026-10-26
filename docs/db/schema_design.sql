-- =============================================================================
-- Закрома — схема БД MVP (PostgreSQL 16+)
--
-- Это ПРОЕКТНАЯ схема: эталон для первой миграции Alembic (задачи T-003, T-010,
-- T-020, T-031). После появления миграций источником истины становятся они, а
-- этот файл обновляется скриптом `pg_dump --schema-only` (см. docs/04-data-model.md).
--
-- Соглашения:
--   * PK — uuid (gen_random_uuid()), кроме журнала событий (bigint identity).
--   * Перечисления — text + CHECK (проще мигрировать, чем PG enum).
--   * Уровни запаса — smallint 0..5: 0 out, 1 critical, 2 low, 3 normal,
--     4 plenty, 5 excess (сравнимы, max() работает).
--   * Количества — numeric(12,3) в базовой единице продукта (g / ml / pcs).
--   * Моменты — timestamptz; сроки и даты покупки — date.
--   * Изменяемые сущности, редактируемые из UI, имеют version (оптимистичная блокировка).
--   * Принадлежность дому обеспечивается составными FK (household_id, id).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Нормализация для сравнения названий: нижний регистр, ё → е.
CREATE OR REPLACE FUNCTION zk_search_norm(t text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    RETURN lower(replace(replace(t, 'ё', 'е'), 'Ё', 'Е'));

-- Ключ нечёткого поиска: нормализация + свёртка гласных, в которых чаще всего
-- ошибаются (о→а, э→е, я→а, ы→и): «малако» находит «молоко», «макорон» — «макароны».
CREATE OR REPLACE FUNCTION zk_search_fold(t text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    RETURN translate(zk_search_norm(t), 'оэяы', 'аеаи');

-- -----------------------------------------------------------------------------
-- Пользователи и сессии
-- -----------------------------------------------------------------------------

CREATE TABLE users (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email               text NOT NULL CHECK (email = lower(email) AND position('@' IN email) > 1),
    display_name        text NOT NULL CHECK (length(btrim(display_name)) BETWEEN 1 AND 60),
    password_hash       text NOT NULL,                       -- Argon2id
    last_household_id   uuid,                                -- FK добавлен ниже (цикл)
    -- Предложение ревизии (05 §9.2): период в днях, NULL — выключено; «Не сейчас» откладывает.
    revision_reminder_days  smallint DEFAULT 21 CHECK (revision_reminder_days IN (7, 14, 21, 28)),
    revision_snoozed_until  timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_uq ON users (email);

CREATE TABLE sessions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash      bytea NOT NULL UNIQUE,                   -- sha256(token)
    created_at      timestamptz NOT NULL DEFAULT now(),
    last_seen_at    timestamptz NOT NULL DEFAULT now(),
    expires_at      timestamptz NOT NULL,
    user_agent      text
);
CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_expires_idx ON sessions (expires_at);

-- Для ограничения перебора паролей (FR-AUTH-06). Чистится периодически.
CREATE TABLE login_attempts (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email           text NOT NULL,
    attempted_at    timestamptz NOT NULL DEFAULT now(),
    success         boolean NOT NULL
);
CREATE INDEX login_attempts_email_time_idx ON login_attempts (email, attempted_at DESC);

-- -----------------------------------------------------------------------------
-- Дома и участники
-- -----------------------------------------------------------------------------

CREATE TABLE households (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 60),
    timezone        text NOT NULL DEFAULT 'Europe/Moscow',
    expiring_days   smallint NOT NULL DEFAULT 3 CHECK (expiring_days BETWEEN 0 AND 60),
    archived_at     timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    version         integer NOT NULL DEFAULT 1
);

ALTER TABLE users
    ADD CONSTRAINT users_last_household_fk
    FOREIGN KEY (last_household_id) REFERENCES households (id) ON DELETE SET NULL;

CREATE TABLE household_members (
    household_id    uuid NOT NULL REFERENCES households (id) ON DELETE CASCADE,
    user_id         uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    joined_at       timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (household_id, user_id)
);
CREATE INDEX household_members_user_idx ON household_members (user_id);

CREATE TABLE household_invites (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id    uuid NOT NULL REFERENCES households (id) ON DELETE CASCADE,
    token_hash      bytea NOT NULL UNIQUE,
    created_by      uuid REFERENCES users (id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    expires_at      timestamptz NOT NULL,
    revoked_at      timestamptz,
    CHECK (expires_at > created_at)
);
CREATE INDEX household_invites_household_idx ON household_invites (household_id);

CREATE TABLE password_reset_tokens (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash      bytea NOT NULL UNIQUE,
    created_by      uuid REFERENCES users (id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    expires_at      timestamptz NOT NULL,
    used_at         timestamptz,
    CHECK (expires_at > created_at)
);

-- -----------------------------------------------------------------------------
-- Глобальный справочник (только чтение; загружается миграцией из CSV)
-- -----------------------------------------------------------------------------

CREATE TABLE categories (
    slug            text PRIMARY KEY CHECK (slug ~ '^[a-z][a-z0-9_]*$'),
    name_ru         text NOT NULL,
    icon            text,                                    -- эмодзи или имя иконки
    sort_order      smallint NOT NULL DEFAULT 0
);

-- Бытовые меры (ADR-0013, 05-domain-rules §1.1): пачка, стакан, ложка, ломтик, банка…
-- Формы: «1 пачка», «2 пачки», «5 пачек», «½ пачки» / «меньше пачки».
CREATE TABLE measures (
    slug            text PRIMARY KEY CHECK (slug ~ '^[a-z][a-z0-9_]*$'),
    name_one        text NOT NULL,
    name_few        text NOT NULL,
    name_many       text NOT NULL,
    name_gen        text NOT NULL,
    halves          boolean NOT NULL DEFAULT false,         -- можно брать половину («½ пачки»)
    sort_order      smallint NOT NULL DEFAULT 0
);

CREATE TABLE catalog_products (
    slug                    text PRIMARY KEY CHECK (slug ~ '^[a-z][a-z0-9_]*$'),
    name_ru                 text NOT NULL,
    aliases                 text NOT NULL DEFAULT '',         -- синонимы через '|'
    category_slug           text NOT NULL REFERENCES categories (slug),
    unit                    text NOT NULL CHECK (unit IN ('g', 'ml', 'pcs')),
    tracking_mode           text NOT NULL CHECK (tracking_mode IN ('exact', 'level')),
    default_location_kind   text NOT NULL CHECK (default_location_kind IN
                                ('fridge', 'freezer', 'pantry', 'cellar', 'balcony', 'other')),
    critical_below          numeric(12,3) CHECK (critical_below > 0),
    low_below               numeric(12,3) CHECK (low_below >= 0),
    plenty_from             numeric(12,3) CHECK (plenty_from >= 0),
    excess_from             numeric(12,3) CHECK (excess_from >= 0),
    shelf_life_days         integer CHECK (shelf_life_days > 0),
    shelf_life_opened_days  integer CHECK (shelf_life_opened_days > 0),
    shelf_life_frozen_days  integer CHECK (shelf_life_frozen_days > 0),
    keep_in_stock           boolean NOT NULL DEFAULT false,   -- норма дома по умолчанию (05 §3.7)
    search_text             text GENERATED ALWAYS AS (zk_search_fold(name_ru || ' ' || aliases)) STORED,
    CONSTRAINT catalog_thresholds_ordered CHECK (
        coalesce(critical_below, 0) <= coalesce(low_below, critical_below, 0)
        AND coalesce(low_below, critical_below, 0) <= coalesce(plenty_from, low_below, critical_below, 0)
        AND coalesce(plenty_from, low_below, critical_below, 0) <= coalesce(excess_from, plenty_from, low_below, critical_below, 0)
    )
);
CREATE INDEX catalog_products_search_trgm ON catalog_products USING gin (search_text gin_trgm_ops);

-- Меры позиции справочника: как покупают (buy, не больше одной) и как берут (use, до двух —
-- проверяют валидатор CSV и сервис). amount — в базовой единице позиции.
CREATE TABLE catalog_product_measures (
    catalog_slug    text NOT NULL REFERENCES catalog_products (slug) ON DELETE CASCADE,
    role            text NOT NULL CHECK (role IN ('buy', 'use')),
    measure_slug    text NOT NULL REFERENCES measures (slug),
    amount          numeric(12,3) NOT NULL CHECK (amount > 0),
    sort_order      smallint NOT NULL DEFAULT 0,
    PRIMARY KEY (catalog_slug, role, measure_slug)
);
CREATE UNIQUE INDEX catalog_product_measures_one_buy_uq ON catalog_product_measures (catalog_slug) WHERE role = 'buy';

-- -----------------------------------------------------------------------------
-- Места хранения
-- -----------------------------------------------------------------------------

CREATE TABLE storage_locations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id    uuid NOT NULL REFERENCES households (id) ON DELETE CASCADE,
    name            text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 40),
    kind            text NOT NULL CHECK (kind IN ('fridge', 'freezer', 'pantry', 'cellar', 'balcony', 'other')),
    sort_order      smallint NOT NULL DEFAULT 0,
    checked_at      timestamptz,                             -- последняя «Проверка места» (05 §9)
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    version         integer NOT NULL DEFAULT 1,
    UNIQUE (household_id, id)
);
CREATE UNIQUE INDEX storage_locations_name_uq ON storage_locations (household_id, zk_search_norm(name));

-- -----------------------------------------------------------------------------
-- Продукты дома
-- -----------------------------------------------------------------------------

CREATE TABLE products (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id            uuid NOT NULL REFERENCES households (id) ON DELETE CASCADE,
    catalog_slug            text REFERENCES catalog_products (slug),
    name                    text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 80),
    aliases                 text NOT NULL DEFAULT '',
    category_slug           text NOT NULL REFERENCES categories (slug),
    unit                    text NOT NULL CHECK (unit IN ('g', 'ml', 'pcs')),
    tracking_mode           text NOT NULL CHECK (tracking_mode IN ('exact', 'level')),
    default_location_id     uuid,                             -- «как в прошлый раз» (05 §8)
    critical_below          numeric(12,3) CHECK (critical_below > 0),
    low_below               numeric(12,3) CHECK (low_below >= 0),
    plenty_from             numeric(12,3) CHECK (plenty_from >= 0),
    excess_from             numeric(12,3) CHECK (excess_from >= 0),
    shelf_life_days         integer CHECK (shelf_life_days > 0),
    shelf_life_opened_days  integer CHECK (shelf_life_opened_days > 0),
    shelf_life_frozen_days  integer CHECK (shelf_life_frozen_days > 0),
    keep_in_stock           boolean NOT NULL DEFAULT false,   -- норма дома = keep_in_stock + low_below
    last_added_quantity     numeric(12,3) CHECK (last_added_quantity > 0),  -- «как в прошлый раз»
    archived_at             timestamptz,
    search_text             text GENERATED ALWAYS AS (zk_search_fold(name || ' ' || aliases)) STORED,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),
    version                 integer NOT NULL DEFAULT 1,
    UNIQUE (household_id, id),
    FOREIGN KEY (household_id, default_location_id)
        REFERENCES storage_locations (household_id, id) ON DELETE SET NULL (default_location_id),
    CONSTRAINT products_thresholds_ordered CHECK (
        coalesce(critical_below, 0) <= coalesce(low_below, critical_below, 0)
        AND coalesce(low_below, critical_below, 0) <= coalesce(plenty_from, low_below, critical_below, 0)
        AND coalesce(plenty_from, low_below, critical_below, 0) <= coalesce(excess_from, plenty_from, low_below, critical_below, 0)
    )
);
CREATE UNIQUE INDEX products_catalog_uq ON products (household_id, catalog_slug) WHERE catalog_slug IS NOT NULL;
CREATE UNIQUE INDEX products_name_active_uq ON products (household_id, zk_search_norm(name)) WHERE archived_at IS NULL;
CREATE INDEX products_search_trgm ON products USING gin (search_text gin_trgm_ops);

-- Меры продукта дома: копия мер справочника при создании продукта, правится в настройках.
CREATE TABLE product_measures (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id    uuid NOT NULL REFERENCES households (id) ON DELETE CASCADE,
    product_id      uuid NOT NULL,
    role            text NOT NULL CHECK (role IN ('buy', 'use')),
    measure_slug    text NOT NULL REFERENCES measures (slug),
    amount          numeric(12,3) NOT NULL CHECK (amount > 0),
    sort_order      smallint NOT NULL DEFAULT 0,
    FOREIGN KEY (household_id, product_id) REFERENCES products (household_id, id) ON DELETE CASCADE,
    UNIQUE (product_id, role, measure_slug)
);
CREATE UNIQUE INDEX product_measures_one_buy_uq ON product_measures (product_id) WHERE role = 'buy';

-- -----------------------------------------------------------------------------
-- Партии (текущее состояние запасов)
-- -----------------------------------------------------------------------------

CREATE TABLE inventory_items (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id        uuid NOT NULL REFERENCES households (id) ON DELETE CASCADE,
    product_id          uuid NOT NULL,
    location_id         uuid NOT NULL,
    quantity            numeric(12,3) CHECK (quantity >= 0),
    quantity_is_approx  boolean NOT NULL DEFAULT false,
    level               smallint CHECK (level BETWEEN 0 AND 5),
    purchased_on        date NOT NULL,
    expires_on          date,
    expiry_source       text NOT NULL CHECK (expiry_source IN ('package', 'estimated', 'none')),
    opened_on           date,
    finished_at         timestamptz,
    created_by          uuid REFERENCES users (id) ON DELETE SET NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    version             integer NOT NULL DEFAULT 1,
    UNIQUE (household_id, id),
    FOREIGN KEY (household_id, product_id)  REFERENCES products (household_id, id),
    FOREIGN KEY (household_id, location_id) REFERENCES storage_locations (household_id, id),
    CONSTRAINT items_quantity_or_level CHECK (quantity IS NOT NULL OR level IS NOT NULL),
    CONSTRAINT items_expiry_consistent CHECK ((expiry_source = 'none') = (expires_on IS NULL)),
    CONSTRAINT items_opened_after_purchase CHECK (opened_on IS NULL OR opened_on >= purchased_on)
);
-- Активные партии — основной рабочий набор.
CREATE INDEX inventory_items_active_product_idx ON inventory_items (household_id, product_id) WHERE finished_at IS NULL;
CREATE INDEX inventory_items_active_location_idx ON inventory_items (household_id, location_id) WHERE finished_at IS NULL;
CREATE INDEX inventory_items_active_expiry_idx ON inventory_items (household_id, expires_on) WHERE finished_at IS NULL;

-- -----------------------------------------------------------------------------
-- Журнал событий (только INSERT)
-- -----------------------------------------------------------------------------

CREATE TABLE stock_events (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    household_id        uuid NOT NULL REFERENCES households (id) ON DELETE CASCADE,
    item_id             uuid NOT NULL,
    product_id          uuid NOT NULL,                       -- денормализация для статистики
    type                text NOT NULL CHECK (type IN
                            ('added', 'consumed', 'discarded', 'adjusted', 'moved', 'opened', 'level_set')),
    quantity_delta      numeric(12,3),
    level_before        smallint CHECK (level_before BETWEEN 0 AND 5),
    level_after         smallint CHECK (level_after BETWEEN 0 AND 5),
    from_location_id    uuid,
    to_location_id      uuid,
    actor_user_id       uuid REFERENCES users (id) ON DELETE SET NULL,
    occurred_at         timestamptz NOT NULL DEFAULT now(),
    note                text,
    source              text NOT NULL DEFAULT 'action' CHECK (source IN ('action', 'check')),  -- check: проверка места / ревизия (05 §9)
    FOREIGN KEY (household_id, item_id)    REFERENCES inventory_items (household_id, id),
    FOREIGN KEY (household_id, product_id) REFERENCES products (household_id, id),
    CONSTRAINT events_consume_negative CHECK (
        type NOT IN ('consumed', 'discarded') OR quantity_delta IS NULL OR quantity_delta <= 0),
    CONSTRAINT events_added_positive CHECK (
        type <> 'added' OR quantity_delta IS NULL OR quantity_delta > 0),
    CONSTRAINT events_move_has_locations CHECK (
        type <> 'moved' OR (from_location_id IS NOT NULL AND to_location_id IS NOT NULL))
);
CREATE INDEX stock_events_product_time_idx ON stock_events (household_id, product_id, occurred_at DESC);
CREATE INDEX stock_events_household_time_idx ON stock_events (household_id, occurred_at DESC);

-- Запрет UPDATE/DELETE журнала (NFR-REL-05). Следствие: дом с событиями нельзя
-- удалить каскадом — дома архивируются (households.archived_at). Физическое
-- удаление — только обслуживающим скриптом с SET session_replication_role = replica.
CREATE OR REPLACE FUNCTION zk_stock_events_immutable() RETURNS trigger
    LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'stock_events is append-only';
END;
$$;
CREATE TRIGGER stock_events_no_update BEFORE UPDATE ON stock_events
    FOR EACH ROW EXECUTE FUNCTION zk_stock_events_immutable();
CREATE TRIGGER stock_events_no_delete BEFORE DELETE ON stock_events
    FOR EACH ROW EXECUTE FUNCTION zk_stock_events_immutable();
