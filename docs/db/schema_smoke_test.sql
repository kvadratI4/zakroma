-- Проверка инвариантов проектной схемы schema_design.sql на реальном Postgres.
-- Запуск: psql -v ON_ERROR_STOP=1 -d <пустая БД со schema_design.sql> -f schema_smoke_test.sql
-- Каждая проверка «должно упасть» выполняется в SAVEPOINT; если не упала — RAISE.

BEGIN;

INSERT INTO categories (slug, name_ru) VALUES ('pasta', 'Макароны');
INSERT INTO users (id, email, display_name, password_hash)
    VALUES ('00000000-0000-0000-0000-0000000000a1', 'a@example.ru', 'Аня', 'x'),
           ('00000000-0000-0000-0000-0000000000b1', 'b@example.ru', 'Борис', 'x');
INSERT INTO households (id, name) VALUES
    ('00000000-0000-0000-0000-00000000000a', 'Квартира'),
    ('00000000-0000-0000-0000-00000000000b', 'Чужой дом');
INSERT INTO storage_locations (id, household_id, name, kind) VALUES
    ('00000000-0000-0000-0000-0000000001aa', '00000000-0000-0000-0000-00000000000a', 'Шкаф', 'pantry'),
    ('00000000-0000-0000-0000-0000000001bb', '00000000-0000-0000-0000-00000000000b', 'Шкаф', 'pantry');
INSERT INTO products (id, household_id, name, category_slug, unit, tracking_mode, portion, low_below, plenty_from, excess_from)
    VALUES ('00000000-0000-0000-0000-0000000002aa', '00000000-0000-0000-0000-00000000000a',
            'Макароны', 'pasta', 'g', 'exact', 80, 400, 1500, 4000);

-- OK: партия своего дома
INSERT INTO inventory_items (id, household_id, product_id, location_id, quantity, purchased_on, expiry_source)
    VALUES ('00000000-0000-0000-0000-0000000003aa', '00000000-0000-0000-0000-00000000000a',
            '00000000-0000-0000-0000-0000000002aa', '00000000-0000-0000-0000-0000000001aa', 900, '2026-11-01', 'none');
INSERT INTO stock_events (household_id, item_id, product_id, type, quantity_delta)
    VALUES ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000003aa',
            '00000000-0000-0000-0000-0000000002aa', 'added', 900);

DO $$
BEGIN
    -- 1. Место чужого дома
    BEGIN
        INSERT INTO inventory_items (household_id, product_id, location_id, quantity, purchased_on, expiry_source)
        VALUES ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000002aa',
                '00000000-0000-0000-0000-0000000001bb', 1, '2026-11-01', 'none');
        RAISE EXCEPTION 'FAIL: cross-household location accepted';
    EXCEPTION WHEN foreign_key_violation THEN RAISE NOTICE 'ok 1: cross-household FK rejected';
    END;

    -- 2. Пороги не по порядку
    BEGIN
        INSERT INTO products (household_id, name, category_slug, unit, tracking_mode, portion, plenty_from)
        VALUES ('00000000-0000-0000-0000-00000000000a', 'Плохие пороги', 'pasta', 'g', 'exact', 500, 100);
        RAISE EXCEPTION 'FAIL: unordered thresholds accepted';
    EXCEPTION WHEN check_violation THEN RAISE NOTICE 'ok 2: unordered thresholds rejected';
    END;

    -- 3. Ни количества, ни уровня
    BEGIN
        INSERT INTO inventory_items (household_id, product_id, location_id, purchased_on, expiry_source)
        VALUES ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000002aa',
                '00000000-0000-0000-0000-0000000001aa', '2026-11-01', 'none');
        RAISE EXCEPTION 'FAIL: item without quantity and level accepted';
    EXCEPTION WHEN check_violation THEN RAISE NOTICE 'ok 3: quantity-or-level enforced';
    END;

    -- 4. Источник срока 'package' без даты
    BEGIN
        INSERT INTO inventory_items (household_id, product_id, location_id, quantity, purchased_on, expiry_source)
        VALUES ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000002aa',
                '00000000-0000-0000-0000-0000000001aa', 1, '2026-11-01', 'package');
        RAISE EXCEPTION 'FAIL: package expiry without date accepted';
    EXCEPTION WHEN check_violation THEN RAISE NOTICE 'ok 4: expiry consistency enforced';
    END;

    -- 5. Журнал только на запись
    BEGIN
        UPDATE stock_events SET note = 'x';
        RAISE EXCEPTION 'FAIL: stock_events update allowed';
    EXCEPTION WHEN raise_exception THEN
        IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
        RAISE NOTICE 'ok 5: stock_events append-only';
    END;

    -- 6. Дубликат названия продукта (ё/е, регистр)
    BEGIN
        INSERT INTO products (household_id, name, category_slug, unit, tracking_mode)
        VALUES ('00000000-0000-0000-0000-00000000000a', 'МАКАРОНЫ', 'pasta', 'g', 'exact');
        RAISE EXCEPTION 'FAIL: duplicate product name accepted';
    EXCEPTION WHEN unique_violation THEN RAISE NOTICE 'ok 6: product name unique (normalized)';
    END;

    -- 7. Списание с положительной дельтой
    BEGIN
        INSERT INTO stock_events (household_id, item_id, product_id, type, quantity_delta)
        VALUES ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000003aa',
                '00000000-0000-0000-0000-0000000002aa', 'consumed', 100);
        RAISE EXCEPTION 'FAIL: positive consume delta accepted';
    EXCEPTION WHEN check_violation THEN RAISE NOTICE 'ok 7: consume delta must be <= 0';
    END;
END $$;

-- 8. Поиск: ё/е и опечатка
DO $$
BEGIN
    INSERT INTO products (household_id, name, category_slug, unit, tracking_mode)
    VALUES ('00000000-0000-0000-0000-00000000000a', 'Мёд', 'pasta', 'g', 'exact');
    IF NOT EXISTS (SELECT 1 FROM products WHERE zk_search_fold('мед') <% search_text) THEN
        RAISE EXCEPTION 'FAIL: ё/е search';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM products WHERE zk_search_fold('макорон') <% search_text) THEN
        RAISE EXCEPTION 'FAIL: typo search';
    END IF;
    RAISE NOTICE 'ok 8: trigram search with ё/е and typo';
END $$;

ROLLBACK;
