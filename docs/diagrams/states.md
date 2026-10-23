# Диаграммы состояний

## Партия (inventory_item)

```mermaid
stateDiagram-v2
    [*] --> Active: added
    state Active {
        [*] --> Sealed
        Sealed --> Opened: opened
        Sealed --> Sealed: consumed (частично) / moved / adjusted
        Opened --> Opened: consumed (частично) / moved / adjusted
    }
    Active --> Finished: consumed / discarded до 0<br/>или уровень «Нет»
    Active --> Finished: adjusted до 0 (ошибочная запись)
    Finished --> [*]
    note right of Finished
        finished_at заполнен,
        строка не удаляется,
        в запасах не показывается
    end note
```

Статус срока (вычисляется, не хранится): `unknown → ok → expiring → expired` по мере приближения `today` к эффективному сроку.

## Задача разработки (tasks/T-xxx.md)

```mermaid
stateDiagram-v2
    [*] --> Backlog
    Backlog --> Ready: описание + критерии приёмки
    Ready --> Proposal: /task-start
    Proposal --> Questions: агент задал вопросы
    Questions --> Proposal: ответы меняют план
    Questions --> Approved: оператор: «ок»
    Proposal --> Approved: вопросов нет, оператор: «ок»
    Approved --> Red: /task-implement — тесты написаны, падают
    Red --> Green: код, тесты проходят
    Green --> Red: следующий тест-кейс
    Green --> Review: /task-finish — DoD выполнен
    Review --> Done: оператор принял
    Review --> Approved: замечания → урок в LESSONS.md
    Done --> [*]
```
