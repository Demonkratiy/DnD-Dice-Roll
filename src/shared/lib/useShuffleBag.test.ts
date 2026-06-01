import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useShuffleBag } from './useShuffleBag.ts'
import type { Rng } from './rng.ts'

/** Детерминированный Rng по заранее заданной последовательности [0,1). */
function seqRng(values: number[]): Rng {
  let i = 0
  return { next: () => values[i++ % values.length] }
}

describe('useShuffleBag', () => {
  it('выдаёт каждый элемент ровно один раз за круг (без повторов внутри круга)', () => {
    const items = ['a', 'b', 'c', 'd'] as const
    const { result } = renderHook(() => useShuffleBag(items))
    const next = result.current

    const round = [next(), next(), next(), next()]
    expect([...round].sort()).toEqual([...items].sort())
  })

  it('не повторяет один и тот же элемент на стыке двух кругов', () => {
    const items = ['a', 'b', 'c'] as const
    const { result } = renderHook(() => useShuffleBag(items))
    const next = result.current

    const seen: string[] = []
    for (let i = 0; i < 30; i++) {
      const value = next()
      if (seen.length > 0) {
        expect(value).not.toBe(seen[seen.length - 1])
      }
      seen.push(value)
    }
  })

  it('детерминирован при инъекции Rng', () => {
    const items = ['a', 'b', 'c'] as const
    // Перемешивание Фишера—Йейтса (от конца к началу) с нулевыми «бросками»
    // даёт массив [b, c, a]; pop() выдаёт его с конца: a, c, b.
    const rng = seqRng([0, 0])
    const { result } = renderHook(() => useShuffleBag(items, rng))
    const next = result.current

    expect([next(), next(), next()]).toEqual(['a', 'c', 'b'])
  })

  it('корректно работает со списком из одного элемента', () => {
    const items = ['only'] as const
    const { result } = renderHook(() => useShuffleBag(items))
    const next = result.current

    expect([next(), next(), next()]).toEqual(['only', 'only', 'only'])
  })
})
