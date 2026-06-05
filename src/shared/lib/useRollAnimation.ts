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
import { SPIN_PER_TURN, SPIN_SWAP_PERIOD, spinRevealIndex } from './spinReveal.ts'

export type RollPhase = 'idle' | 'scramble' | 'settle' | 'reveal'

/** Состояние одного анимируемого кубика. */
export interface AnimatedDie {
  value: number
  frameIndex: number
  settled: boolean
  /**
   * Подписанный угол поворота силуэта/цифры (градусы) для этого кубика. У каждого
   * кубика своя длительность и СВОЁ направление (знак), поэтому угол теперь живёт
   * на кости, а не один на всю группу. CSS «дотягивает» поворот за `rotMs`.
   */
  rot?: number
  /** Длительность CSS-перехода поворота этого кубика (мс). */
  rotMs?: number
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
  /**
   * «Эпический» бросок (особо сильное зажатие): добавляет вращению лишнее время
   * и удлиняет медленный «хвост» замедления — максимум драмы. На результат, как
   * и intensity, не влияет.
   */
  epic?: boolean
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
const SETTLE_DELAY = 120
const REVEAL_HOLD = 700
// Эпический бросок длится заметно дольше — «затаённое дыхание» перед результатом.
const EPIC_EXTRA_DURATION = 3200
// Разброс длительности МЕЖДУ кубиками (мс). Базовую длительность каждый кубик
// получает одинаковой, а сверху — случайную добавку 0..SPIN_DURATION_SPREAD.
// Поэтому кубики финишируют вразнобой (одни замирают раньше, другие тянут долгий
// хвост) — «приземление по одному» добавляет драмы. Размах большой намеренно.
const SPIN_DURATION_SPREAD = 1800
// Сколько миллисекунд приходится на один полный оборот при выборе числа оборотов.
// Чем больше длительность кубика — тем больше оборотов, поэтому стартовая скорость
// (∝ обороты/длительность) у всех примерно одинаковая и читаемая как «вихрь».
const MS_PER_TURN = 220
// Минимум оборотов, чтобы даже самый короткий бросок успел «прокрутиться».
const MIN_TURNS = 3
// Запас длительности CSS-перехода поворота. Угол на экране отстаёт от целевого
// (transition), поэтому момент смены числа считаем по «экранному» углу. Множитель
// >1 гарантирует, что linear-переход не доедет раньше следующего кадра — без пауз.
const SPIN_MS_SLACK = 1.6
const easeOut = (t: number) => 1 - (1 - t) * (1 - t)
// Очень крутая замедляющая кривая для эпика (5-я степень): почти всё
// время кубик крутится быстро, затем резко срывается в долгий тягучий хвост —
// последние обороты почти стоят. Контраст «быстро→медленно» максимальный.
const easeOutEpic = (t: number) => 1 - (1 - t) ** 5
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
// Случайное вещественное в [min, max). Визуальная случайность (направление/срок
// вращения) — НЕ доменная: на честный результат броска не влияет.
const randRange = (min: number, max: number) => min + Math.random() * (max - min)
// Доля поворота, после которой остаток считаем «визуально докрученным»: кривая
// ease асимптотически подползает к total, и последние доли процента угла глазом
// не видны — кубик кажется стоящим. Дотягивать их = «мёртвая пауза» (особенно у
// эпика с длинным хвостом 5-й степени). Поэтому анимацию каждого кубика
// завершаем, как только ease достигает этого порога, а не полного duration.
const SPIN_COMPLETE = 0.997
// Доля duration, на которой ease достигает SPIN_COMPLETE (обратная функция ease):
//   easeOut:     1-(1-x)^2 = C  →  x = 1 - sqrt(1-C)
//   easeOutEpic: 1-(1-x)^5 = C  →  x = 1 - (1-C)^(1/5)
// Для эпика это ~0.69 — отрезаем ~31% невидимого хвоста, пауза в конце исчезает.
const easeOutCompleteFraction = 1 - Math.sqrt(1 - SPIN_COMPLETE)
const easeOutEpicCompleteFraction = 1 - (1 - SPIN_COMPLETE) ** (1 / 5)

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
    ({ values, sides, intensity = 0, epic = false }: StartRollParams) => {
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

      const baseDuration =
        BASE_DURATION +
        clamp01(intensity) * MAX_EXTRA_DURATION +
        (epic ? EPIC_EXTRA_DURATION : 0)
      // На эпике вращение сильнее замедляется к финалу (крутая кривая
      // easeOutEpic) — резкий контраст «вихрь → величавый докрут».
      const ease = epic ? easeOutEpic : easeOut
      const startTime = performance.now()

      // ── Случайные параметры ПО КУБИКАМ (визуальные, НЕ доменные) ───────────
      // У каждого кубика своя длительность (base + случайный разброс до
      // SPIN_DURATION_SPREAD), своё направление вращения (±) и своё число
      // оборотов. Число оборотов ∝ длительности (через MS_PER_TURN), поэтому
      // стартовая угловая скорость у всех примерно одинакова — отличается именно
      // ВРЕМЯ докрута, отчего кубики «приземляются» вразнобой. Угол total кратен
      // полному обороту (SPIN_PER_TURN), так что к финишу кубик приходит «лицом»
      // (не зеркально) и его не нужно дёргать в вертикаль.
      const dirs = values.map(() => (Math.random() < 0.5 ? 1 : -1))
      const durations = values.map(
        () => baseDuration + randRange(0, SPIN_DURATION_SPREAD),
      )
      const totals = durations.map(
        (d) => Math.max(MIN_TURNS, Math.round(d / MS_PER_TURN)) * SPIN_PER_TURN,
      )
      // Момент, когда кубик ВИЗУАЛЬНО докручен (ease достиг SPIN_COMPLETE): дальше
      // он лишь подползает доли градуса к total — это незаметно глазу, но тянуло бы
      // «мёртвую паузу» (особенно у эпика с длинным хвостом). На spinEnd кубик
      // фиксируем (settled) на финале «лицом». Группа завершается по самому
      // позднему spinEnd, а не по полному duration — пауза в конце исчезает.
      const completeFraction = epic
        ? easeOutEpicCompleteFraction
        : easeOutCompleteFraction
      const spinEnds = durations.map((d) => d * completeFraction)
      const maxSpinEnd = Math.max(...spinEnds)

      // Случайное число 1..sides, ГАРАНТИРОВАННО отличное от prev (если sides > 1):
      // повтор 14 → 14 читался бы как зависший кадр, особенно у ребра, где ждут
      // «раскрытия» нового числа.
      const nextValue = (prev: number): number => {
        if (sides <= 1) return 1
        const r = Math.floor(Math.random() * (sides - 1)) + 1 // 1..sides-1
        return r >= prev ? r + 1 : r // «пропускаем» prev, сдвигая верхний диапазон
      }

      // Состояние перебора ПО КУБИКАМ. Кадры (силуэты) гоним детерминированно по
      // кругу через счётчик свапов (+i рассинхронизирует кубики), значения — через
      // nextValue. Угол на экране отстаёт от целевого (CSS-transition), поэтому
      // момент смены числа и «приземление» считаем по ЭКРАННОМУ углу (shown).
      const swapCounts = values.map(() => 0)
      const prevThetas = values.map(() => 0)
      const revealIndexes = values.map(() => spinRevealIndex(0))
      const landedFlags = values.map(() => false)
      const shownValues = values.map(() => nextValue(0))

      // Кадр ОДНОГО кубика на момент времени (elapsed от старта, dt — длина кадра).
      const tickDie = (i: number, elapsed: number, dt: number): AnimatedDie => {
        const finalValue = values[i]
        // Этот кубик уже докрутился: финал «лицом» (total кратен обороту), settled.
        if (elapsed >= spinEnds[i]) {
          return {
            value: finalValue,
            frameIndex: (swapCounts[i] + i) % framesPerDie,
            settled: true,
            rot: dirs[i] * totals[i],
            rotMs: dt * SPIN_MS_SLACK,
          }
        }
        // Угол интерполируем по ease: скорость падает к финалу естественно (→0),
        // поэтому отставание экрана к концу тоже исчезает — финал садится точно.
        const theta = totals[i] * ease(clamp01(elapsed / durations[i]))
        const step = theta - prevThetas[i]
        prevThetas[i] = theta
        // ЭКРАННЫЙ угол: целевой минус отставание CSS-перехода. По нему ловим ребро.
        const shown = theta - SPIN_MS_SLACK * step
        const idx = spinRevealIndex(shown)
        if (idx !== revealIndexes[i]) {
          revealIndexes[i] = idx
          swapCounts[i] += 1
          // Если до total осталось ≤ одного периода смены — это последний видимый
          // оборот: показываем уже финал, чтобы итог «приземлился» заранее, а не
          // выскакивал в settle.
          if (!landedFlags[i] && totals[i] - shown <= SPIN_SWAP_PERIOD) {
            landedFlags[i] = true
          }
          shownValues[i] = landedFlags[i] ? finalValue : nextValue(shownValues[i])
        }
        return {
          value: shownValues[i],
          frameIndex: (swapCounts[i] + i) % framesPerDie,
          settled: false,
          rot: dirs[i] * theta,
          rotMs: dt * SPIN_MS_SLACK,
        }
      }

      let lastTime = startTime
      const tick = (now: number) => {
        const elapsed = now - startTime

        if (elapsed >= maxSpinEnd) {
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

        const dt = now - lastTime
        lastTime = now
        const dice = values.map((_, i) => tickDie(i, elapsed, dt))
        setState({ phase: 'scramble', dice })
        rafRef.current = requestAnimationFrame(tick)
      }

      // Старт сразу с фазы scramble. Первый кадр считаем при elapsed=0 (углы 0) с
      // маленьким rotMs (~16 мс): первый tick почти сразу перезапишет его реальным dt.
      const initialDice = values.map((_, i) => tickDie(i, 0, 16))
      setState({ phase: 'scramble', dice: initialDice })
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
