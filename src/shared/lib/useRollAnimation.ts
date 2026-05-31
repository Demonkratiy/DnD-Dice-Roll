/**
 * useRollAnimation — анимация броска: фазы scramble → settle → reveal.
 *
 * Идея «эмоций»: после честного броска (значения уже известны) кубик визуально
 * «перебирает формы» — быстро меняет вариации силуэта и мелькающие числа,
 * постепенно замедляясь (ease-out), затем фиксируется и показывает результат.
 *
 * ВАЖНО: промежуточные мелькающие числа — это лишь визуальный шум; итоговые
 * значения приходят из доменного броска и не зависят от анимации (честный RNG).
 *
 * Интенсивность жеста (как долго/сильно трясли кубик) удлиняет анимацию и ускоряет
 * стартовую смену форм, но НЕ влияет на результат.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export type RollPhase = 'idle' | 'scramble' | 'settle' | 'reveal'

/** Состояние одного анимируемого кубика. */
export interface AnimatedDie {
  value: number
  frameIndex: number
  settled: boolean
}

export interface RollAnimationState {
  phase: RollPhase
  dice: AnimatedDie[]
}

export interface StartRollParams {
  /** Финальные значения костей (из честного броска). */
  values: number[]
  /** Число граней кости (для мелькающих промежуточных значений). */
  sides: number
  /** Интенсивность 0..1 из жеста: дольше/сильнее → дольше анимация. */
  intensity?: number
}

export interface UseRollAnimationOptions {
  /** Сколько вариаций силуэта у кубика. */
  framesPerDie?: number
  /** Уважать «уменьшить движение»: почти мгновенный показ результата. */
  reducedMotion?: boolean
}

// Параметры тайминга (мс).
const BASE_DURATION = 600
const MAX_EXTRA_DURATION = 1600
const START_INTERVAL = 45 // быстрая смена форм в начале
const END_INTERVAL = 175 // замедление к концу
const SETTLE_DELAY = 120
const REVEAL_HOLD = 700

const randomInt = (max: number) => Math.floor(Math.random() * max) + 1
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOut = (t: number) => 1 - (1 - t) * (1 - t)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export function useRollAnimation(
  options: UseRollAnimationOptions = {},
): {
  state: RollAnimationState
  start: (params: StartRollParams) => void
  reset: () => void
} {
  const { framesPerDie = 3, reducedMotion = false } = options

  const [state, setState] = useState<RollAnimationState>({ phase: 'idle', dice: [] })

  const rafRef = useRef<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Очистка таймеров при размонтировании.
  useEffect(() => stop, [stop])

  const start = useCallback(
    ({ values, sides, intensity = 0 }: StartRollParams) => {
      stop()

      const finalDice: AnimatedDie[] = values.map((value) => ({
        value,
        frameIndex: 0,
        settled: true,
      }))

      // Режим «уменьшить движение»: пропускаем тряску, сразу показываем результат.
      if (reducedMotion) {
        setState({ phase: 'reveal', dice: finalDice })
        timeoutRef.current = setTimeout(() => {
          setState((prev) => ({ ...prev, phase: 'idle' }))
        }, REVEAL_HOLD)
        return
      }

      const duration = BASE_DURATION + clamp01(intensity) * MAX_EXTRA_DURATION
      const startTime = performance.now()
      let lastSwap = 0

      const tick = (now: number) => {
        const elapsed = now - startTime
        const progress = clamp01(elapsed / duration)
        const interval = lerp(START_INTERVAL, END_INTERVAL, easeOut(progress))

        if (elapsed >= duration) {
          // Фиксация: показываем финал, короткая пауза, затем reveal.
          setState({ phase: 'settle', dice: finalDice })
          timeoutRef.current = setTimeout(() => {
            setState({ phase: 'reveal', dice: finalDice })
            timeoutRef.current = setTimeout(() => {
              setState((prev) => ({ ...prev, phase: 'idle' }))
            }, REVEAL_HOLD)
          }, SETTLE_DELAY)
          return
        }

        if (elapsed - lastSwap >= interval) {
          lastSwap = elapsed
          setState({
            phase: 'scramble',
            dice: values.map(() => ({
              value: randomInt(sides),
              frameIndex: Math.floor(Math.random() * framesPerDie),
              settled: false,
            })),
          })
        }

        rafRef.current = requestAnimationFrame(tick)
      }

      // Старт сразу с фазы scramble.
      setState({
        phase: 'scramble',
        dice: values.map(() => ({
          value: randomInt(sides),
          frameIndex: Math.floor(Math.random() * framesPerDie),
          settled: false,
        })),
      })
      rafRef.current = requestAnimationFrame(tick)
    },
    [framesPerDie, reducedMotion, stop],
  )

  // Сброс в исходное состояние (например, при смене кубика/количества).
  const reset = useCallback(() => {
    stop()
    setState({ phase: 'idle', dice: [] })
  }, [stop])

  return { state, start, reset }
}
