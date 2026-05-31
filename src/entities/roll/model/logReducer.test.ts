import { describe, it, expect } from 'vitest'
import {
  rollLogReducer,
  initialRollLogState,
  ROLL_LOG_LIMIT,
  type RollLogState,
} from './logReducer.ts'
import type { RollResult } from './types.ts'

/** Фабрика тестового результата броска с уникальным id. */
function makeResult(id: string): RollResult {
  return {
    id,
    request: { die: 'd20', count: 1, modifier: 0, mode: 'normal' },
    author: { id: 'local', name: 'Avatar Name' },
    timestamp: Number(id),
    dice: [{ die: 'd20', value: 12 }],
    dropped: [],
    modifier: 0,
    total: 12,
  }
}

describe('rollLogReducer', () => {
  it('добавляет бросок в начало списка (самый свежий — первым)', () => {
    let state = initialRollLogState
    state = rollLogReducer(state, { type: 'ROLL_ADDED', result: makeResult('1') })
    state = rollLogReducer(state, { type: 'ROLL_ADDED', result: makeResult('2') })

    expect(state.entries.map((e) => e.id)).toEqual(['2', '1'])
  })

  it('очищает лог по событию LOG_CLEARED', () => {
    let state = rollLogReducer(initialRollLogState, {
      type: 'ROLL_ADDED',
      result: makeResult('1'),
    })
    state = rollLogReducer(state, { type: 'LOG_CLEARED' })

    expect(state.entries).toHaveLength(0)
  })

  it('не мутирует исходное состояние', () => {
    const state: RollLogState = initialRollLogState
    rollLogReducer(state, { type: 'ROLL_ADDED', result: makeResult('1') })

    expect(state.entries).toHaveLength(0)
  })

  it('ограничивает число записей лимитом ROLL_LOG_LIMIT', () => {
    let state = initialRollLogState
    for (let i = 0; i < ROLL_LOG_LIMIT + 10; i += 1) {
      state = rollLogReducer(state, { type: 'ROLL_ADDED', result: makeResult(String(i)) })
    }

    expect(state.entries).toHaveLength(ROLL_LOG_LIMIT)
    // Самый свежий бросок должен остаться, самые старые — отброшены.
    expect(state.entries[0].id).toBe(String(ROLL_LOG_LIMIT + 9))
  })
})
