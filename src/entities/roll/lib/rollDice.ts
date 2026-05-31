/**
 * Чистая логика броска кубиков.
 *
 * `rollDice` — детерминированная функция от (запрос, RNG): при одинаковом RNG
 * она всегда даёт одинаковый исход. Никаких обращений к Date.now/crypto/DOM —
 * метаданные события (id, время, автор) добавляются выше, в сервисном слое.
 * Это держит домен чистым и легко тестируемым.
 */

import { getDieSides, type DieType } from '@entities/die'
import { rollSingleDie, type Rng } from '@shared/lib'
import type { DieRoll, RollMode, RollOutcome, RollRequest } from '../model/types.ts'

/**
 * Бросает одну кость с учётом режима.
 * При advantage/disadvantage кость бросается дважды: одно значение становится
 * учитываемым (kept), другое — отброшенным (dropped).
 */
function rollOneWithMode(
  rng: Rng,
  die: DieType,
  mode: RollMode,
): { kept: DieRoll; dropped: DieRoll | null } {
  const sides = getDieSides(die)

  if (mode === 'normal') {
    return { kept: { die, value: rollSingleDie(rng, sides) }, dropped: null }
  }

  const first = rollSingleDie(rng, sides)
  const second = rollSingleDie(rng, sides)
  const keepHigher = mode === 'advantage'
  const keptValue = keepHigher ? Math.max(first, second) : Math.min(first, second)
  const droppedValue = keepHigher ? Math.min(first, second) : Math.max(first, second)

  return {
    kept: { die, value: keptValue },
    dropped: { die, value: droppedValue },
  }
}

/**
 * Вычисляет исход броска по запросу, используя переданный генератор случайности.
 *
 * @param request — что кидаем (номинал, количество, модификатор, режим).
 * @param rng — источник случайности (инъекция зависимости).
 * @returns исход: учитываемые и отброшенные кости, модификатор и итоговая сумма.
 */
export function rollDice(request: RollRequest, rng: Rng): RollOutcome {
  const count = Math.max(1, Math.trunc(request.count))

  const dice: DieRoll[] = []
  const dropped: DieRoll[] = []

  for (let i = 0; i < count; i += 1) {
    const { kept, dropped: droppedRoll } = rollOneWithMode(rng, request.die, request.mode)
    dice.push(kept)
    if (droppedRoll) {
      dropped.push(droppedRoll)
    }
  }

  const diceSum = dice.reduce((sum, roll) => sum + roll.value, 0)
  const total = diceSum + request.modifier

  return {
    dice,
    dropped,
    modifier: request.modifier,
    total,
  }
}
