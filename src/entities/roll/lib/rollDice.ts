/**
 * Чистая логика броска кубиков.
 *
 * `rollDice` — детерминированная функция от (запрос, RNG): при одинаковом RNG
 * она всегда даёт одинаковый исход. Никаких обращений к Date.now/crypto/DOM —
 * метаданные события (id, время, автор) добавляются выше, в сервисном слое.
 * Это держит домен чистым и легко тестируемым.
 */

import { getDieSides } from '@entities/die'
import { rollSingleDie, type Rng } from '@shared/lib'
import type { DieRoll, RollOutcome, RollRequest } from '../model/types.ts'

/**
 * Вычисляет исход броска по запросу, используя переданный генератор случайности.
 *
 * Две принципиально разные семантики `count` в зависимости от режима:
 *  - `normal` — `count` кубиков складываются (классическое Nd6, 3d8 и т.п.);
 *  - `advantage`/`disadvantage` — `count` образует **пул**, из которого
 *    оставляется ОДНА кость (наибольшая при преимуществе, наименьшая при помехе),
 *    остальные уходят в `dropped`. Это покрывает и обычное преимущество (пул 2),
 *    и «эльфийскую меткость» (пул 3) — без отдельного флага-черты.
 *
 * @param request — что кидаем (номинал, количество, модификатор, режим).
 * @param rng — источник случайности (инъекция зависимости).
 * @returns исход: учитываемые и отброшенные кости, модификатор и итоговая сумма.
 */
export function rollDice(request: RollRequest, rng: Rng): RollOutcome {
  const sides = getDieSides(request.die)
  const count = Math.max(1, Math.trunc(request.count))

  // Обычный режим: бросаем `count` костей, все учитываются и идут в сумму.
  if (request.mode === 'normal') {
    const dice: DieRoll[] = []
    for (let i = 0; i < count; i += 1) {
      dice.push({ die: request.die, value: rollSingleDie(rng, sides) })
    }
    const total = dice.reduce((sum, roll) => sum + roll.value, 0) + request.modifier
    return { dice, dropped: [], modifier: request.modifier, total }
  }

  // Преимущество/помеха: бросаем пул минимум из двух костей и оставляем одну.
  const poolSize = Math.max(2, count)
  const pool: DieRoll[] = []
  for (let i = 0; i < poolSize; i += 1) {
    pool.push({ die: request.die, value: rollSingleDie(rng, sides) })
  }

  const keepHigher = request.mode === 'advantage'
  let winnerIndex = 0
  for (let i = 1; i < pool.length; i += 1) {
    const isBetter = keepHigher
      ? pool[i].value > pool[winnerIndex].value
      : pool[i].value < pool[winnerIndex].value
    if (isBetter) {
      winnerIndex = i
    }
  }

  const kept = pool[winnerIndex]
  const dropped = pool.filter((_, index) => index !== winnerIndex)
  const total = kept.value + request.modifier

  return { dice: [kept], dropped, modifier: request.modifier, total }
}
