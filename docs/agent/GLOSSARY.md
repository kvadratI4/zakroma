# Глоссарий (UI ↔ документация ↔ код)

| В интерфейсе | В документации | В коде / БД |
|---|---|---|
| Дом | дом | `household` |
| Участник | член дома | `member`, `household_members` |
| Место (Холодильник…) | место хранения | `storage_location`, `location`, `kind` |
| — | справочник, позиция справочника | `catalog`, `catalog_product`, `slug` |
| Продукт | продукт дома | `product` |
| (строка в месте) | партия | `inventory_item`, `item` |
| Сколько | количество (базовая единица) | `quantity`, `unit` (`g`/`ml`/`pcs`) |
| ≈ | приблизительное количество | `quantity_is_approx` |
| Упаковка | размер упаковки | `package_size`, `packages` |
| Порция | порция | `portion` |
| Нет / Крит. мало / Мало / Нормально / Много / Избыток | уровень | `level` 0–5: `out, critical, low, normal, plenty, excess` |
| — | пороги | `portion, low_below, plenty_from, excess_from` |
| Держать дома | держать в запасе | `keep_in_stock` |
| Годен до | срок годности | `expires_on` |
| ≈ до… (типовой) | расчётный срок | `expiry_source = estimated` |
| — | эффективный срок | `effective_expiry` |
| Вскрыто | дата вскрытия | `opened_on` |
| Съели, −порция, −½, Закончилось | использовано (списание) | `consume`, event `consumed` |
| Выбросить | выброшено | `discard`, event `discarded` |
| Исправить | исправление | event `adjusted` |
| Переместить | перемещение | `move`, event `moved` |
| История | журнал событий | `stock_events` |
| Запасы | сводка по продуктам | `stock`, `product_summary` |
| Сроки / Покупки | экран предупреждений (два раздела меню, T-004) | `attention` |
| Скоро испортится / Просрочено | статус срока | `expiry_status`: `ok, expiring, expired, unknown` |
| После магазина | пакетное добавление | `POST /items` с массивом |
| Пригласить | приглашение | `household_invite` |
| — | первый пришёл — первый ушёл по сроку | FEFO |
| — | оператор | человек, ведущий проект |
| — | агент | Claude Code |
