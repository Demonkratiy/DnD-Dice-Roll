import { describe, it, expect } from 'vitest'
import type { Rng } from '@shared/lib'
import { rollDice } from './rollDice.ts'
import type { RollRequest } from '../model/types.ts'

/**
 * Детерминированный RNG для тестов: выдаёт заранее заданные значения из очереди.
 * Когда значения заканчиваются — повторяет последнее (защита от выхода за предел).
 */
function sequenceRng(values: number[]): Rng {
  let index = 0
  return {
    next: () => {
      const value = values[Math.min(index, values.length - 1)]
      index += 1
      return value
    },
  }
}

/**
 * Превращает желаемое значение кости в число [0,1), которое заставит
 * `rollSingleDie` (floor(next * sides) + 1) вернуть именно это значение.
 * Берём середину соответствующего интервала.
 */
function valueToRandom(value: number, sides: number): number {
  return (value - 0.5) / sides
}

const baseRequest: RollRequest = { die: 'd6', count: 1, modifier: 0, mode: 'normal' }

describe('rollDice', () => {
  it('бросает одну кость и возвращает значение в допустимом диапазоне', () => {
    const rng = sequenceRng([valueToRandom(4, 6)])
    const outcome = rollDice(baseRequest, rng)

    expect(outcome.dice).toHaveLength(1)
    expect(outcome.dice[0]).toEqual({ die: 'd6', value: 4 })
    expect(outcome.dropped).toHaveLength(0)
    expect(outcome.total).toBe(4)
  })

  it('суммирует несколько костей и прибавляет модификатор (3d6+2)', () => {
    const rng = sequenceRng([
      valueToRandom(3, 6),
      valueToRandom(5, 6),
      valueToRandom(6, 6),
    ])
    const outcome = rollDice({ die: 'd6', count: 3, modifier: 2, mode: 'normal' }, rng)

    expect(outcome.dice.map((d) => d.value)).toEqual([3, 5, 6])
    expect(outcome.modifier).toBe(2)
    expect(outcome.total).toBe(3 + 5 + 6 + 2)
  })

  it('учитывает отрицательный модификатор', () => {
    const rng = sequenceRng([valueToRandom(10, 20)])
    const outcome = rollDice({ die: 'd20', count: 1, modifier: -3, mode: 'normal' }, rng)

    expect(outcome.total).toBe(10 - 3)
  })

  it('advantage оставляет больший бросок, меньший идёт в dropped', () => {
    const rng = sequenceRng([valueToRandom(8, 20), valueToRandom(15, 20)])
    const outcome = rollDice({ die: 'd20', count: 1, modifier: 0, mode: 'advantage' }, rng)

    expect(outcome.dice[0].value).toBe(15)
    expect(outcome.dropped[0].value).toBe(8)
    expect(outcome.total).toBe(15)
  })

  it('disadvantage оставляет меньший бросок, больший идёт в dropped', () => {
    const rng = sequenceRng([valueToRandom(8, 20), valueToRandom(15, 20)])
    const outcome = rollDice(
      { die: 'd20', count: 1, modifier: 0, mode: 'disadvantage' },
      rng,
    )

    expect(outcome.dice[0].value).toBe(8)
    expect(outcome.dropped[0].value).toBe(15)
    expect(outcome.total).toBe(8)
  })

  it('преимущество с пулом из трёх (эльфийская меткость) берёт наибольший из трёх', () => {
    const rng = sequenceRng([
      valueToRandom(7, 20),
      valueToRandom(19, 20),
      valueToRandom(12, 20),
    ])
    const outcome = rollDice({ die: 'd20', count: 3, modifier: 2, mode: 'advantage' }, rng)

    expect(outcome.dice).toHaveLength(1)
    expect(outcome.dice[0].value).toBe(19)
    expect(outcome.dropped.map((d) => d.value)).toEqual([7, 12])
    expect(outcome.total).toBe(19 + 2)
  })

  it('помеха с пулом из двух берёт наименьший, второй уходит в dropped', () => {
    const rng = sequenceRng([valueToRandom(11, 20), valueToRandom(4, 20)])
    const outcome = rollDice({ die: 'd20', count: 2, modifier: 0, mode: 'disadvantage' }, rng)

    expect(outcome.dice).toHaveLength(1)
    expect(outcome.dice[0].value).toBe(4)
    expect(outcome.dropped.map((d) => d.value)).toEqual([11])
    expect(outcome.total).toBe(4)
  })

  it('некорректное количество костей приводится к минимум одной', () => {
    const rng = sequenceRng([valueToRandom(2, 4)])
    const outcome = rollDice({ die: 'd4', count: 0, modifier: 0, mode: 'normal' }, rng)

    expect(outcome.dice).toHaveLength(1)
    expect(outcome.dice[0].value).toBe(2)
  })

  it('детерминирован: одинаковый RNG даёт одинаковый исход', () => {
    const request: RollRequest = { die: 'd8', count: 2, modifier: 1, mode: 'normal' }
    const values = [valueToRandom(3, 8), valueToRandom(7, 8)]

    const first = rollDice(request, sequenceRng(values))
    const second = rollDice(request, sequenceRng(values))

    expect(first).toEqual(second)
  })
})
