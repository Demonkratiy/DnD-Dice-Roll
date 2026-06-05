import { describe, expect, it } from 'vitest'
import {
  MAX_SPIN_STEP,
  SPIN_SWAP_PERIOD,
  SPIN_SWAP_PHASE,
  spinRevealIndex,
} from './spinReveal.ts'

describe('spinReveal', () => {
  it('период смены = половина оборота (один видимый оборот симметричного силуэта)', () => {
    expect(SPIN_SWAP_PERIOD).toBe(180)
    expect(SPIN_SWAP_PHASE).toBe(90)
  })

  it('шаг за кадр меньше половины периода — нельзя «перепрыгнуть» смену', () => {
    expect(MAX_SPIN_STEP).toBeLessThan(SPIN_SWAP_PERIOD / 2)
  })

  it('spinRevealIndex меняется на рёбрах 90°, 270°, 450°…', () => {
    expect(spinRevealIndex(0)).toBe(0)
    expect(spinRevealIndex(89)).toBe(0)
    expect(spinRevealIndex(90)).toBe(1)
    expect(spinRevealIndex(269)).toBe(1)
    expect(spinRevealIndex(270)).toBe(2)
    expect(spinRevealIndex(450)).toBe(3)
  })

  it('одно число держится ровно один видимый оборот (180°)', () => {
    // На любом угле индекс через +180° обязан смениться ровно на 1.
    for (let spin = 0; spin <= 720; spin += 17) {
      expect(spinRevealIndex(spin + SPIN_SWAP_PERIOD)).toBe(spinRevealIndex(spin) + 1)
    }
  })
})
