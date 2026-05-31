# Доменное ядро броска и задел под мультиплеер

> Как устроена «честная» логика броска, почему она чистая и сериализуемая, и где
> проходит «шов» для будущей сетевой игры.

## TL;DR

Бросок — это **чистая функция** `rollDice(request, rng)` без побочных эффектов,
плюс тонкий сервисный слой `RollSource`, который добавляет метаданные события
(id, время, автор). RNG инъектируется. Всё спроектировано так, чтобы локальный
бросок позже можно было заменить на сетевой, не трогая UI.

```mermaid
flowchart TD
    UI["RollScreen / Stage"] -->|"roll(request)"| Source["RollSource (интерфейс)"]
    Source -.сейчас.-> Local["LocalRollSource"]
    Source -.позже.-> Remote["RemoteRollSource (WS)"]
    Local -->|"rollDice(request, rng)"| Domain["rollDice (чистая)"]
    Local --> Meta["+ id, timestamp, author"]
    Domain --> Outcome["RollOutcome"]
    Meta --> Result["RollResult (событие)"]
```

## Чистое ядро: rollDice

Файл: [rollDice.ts](../src/entities/roll/lib/rollDice.ts).

- Детерминирована: при одинаковом `Rng` всегда даёт одинаковый исход.
- Никаких `Date.now`/`crypto`/DOM — только вычисление.
- Обрабатывает количество кубиков, модификатор и режим.

**Advantage/Disadvantage:** кость бросается дважды; одно значение — `kept`
(учитываемое), другое — `dropped` (для прозрачного отображения в логе). При
`advantage` оставляем большее, при `disadvantage` — меньшее. Механика обобщена
(работает для любой кости), хотя по правилам D&D применяется к d20.

```mermaid
flowchart LR
    Req["RollRequest<br/>{die, count, modifier, mode}"] --> Roll["rollDice + Rng"]
    Roll --> Out["RollOutcome<br/>{dice[], dropped[], modifier, total}"]
```

## RNG как зависимость

Файл: [rng.ts](../src/shared/lib/rng.ts).

```ts
interface Rng { next(): number } // [0, 1)
```

- Домен **никогда** не зовёт `Math.random()` напрямую — только через `Rng`.
- Даёт тестируемость (детерминированный генератор в тестах) и задел под seed от
  сервера/ГМ (чтобы у всех игроков совпали и результат, и анимация).
- `rollSingleDie(rng, sides)` → целое в `[1, sides]`.

## Событие броска: RollResult

Типы: [types.ts](../src/entities/roll/model/types.ts).

- `RollOutcome` — чистый исход (`dice`, `dropped`, `modifier`, `total`).
- `RollResult extends RollOutcome` — добавляет метаданные события: `id`, `request`,
  `author` ([Player](../src/entities/player/model/types.ts)), `timestamp`.

Все типы **сериализуемы** — сознательное ограничение: бросок должен быть
самодостаточным объектом, который можно сохранить или передать по сети без потери
смысла.

## Шов под мультиплеер: RollSource

Файл: [RollSource.ts](../src/shared/services/RollSource.ts).

```ts
interface RollSource {
  roll(request: RollRequest): Promise<RollResult>
}
```

- **Сейчас:** `createLocalRollSource({ rng, getAuthor, createId, now })` — считает
  исход через `rollDice` и дополняет метаданными. Все зависимости инъектируются ради
  тестируемости; `createId` по умолчанию — `crypto.randomUUID`.
- **Позже:** `RemoteRollSource` (WebSocket) — тот же интерфейс, другой источник. UI и
  состояние не узнают разницы.
- Метод **асинхронный намеренно** — локальная реализация резолвится сразу, но
  сигнатура уже готова к сетевой задержке.

## Принципы задела (из AGENTS.md, раздел 3)

1. Бросок — чистая сериализуемая доменная функция (событие с id/запросом/костями/
   итогом/временем/автором).
2. RNG инъектируется (на будущее — seed от сервера/ГМ).
3. Источник бросков за интерфейсом `RollSource` (Local → Remote).
4. Понятия `player`/`room` заложены в типах с самого начала.
5. Состояние — через reducer/события (`ROLL_ADDED`): тот же редьюсер обработает
   события из сети (см. [state-management.md](./state-management.md)).

## Тесты

[rollDice.test.ts](../src/entities/roll/lib/rollDice.test.ts) — детерминизм через
подставной `sequenceRng`, проверка count/modifier/advantage/disadvantage.

## Почему так

- **Чистота домена** — логику легко тестировать и переносить на сервер.
- **Инъекция RNG** — единственный источник случайности, контролируемый и
  воспроизводимый.
- **Интерфейс источника** — добавление сети не потребует переписывать UI, только
  новую реализацию `RollSource`.
