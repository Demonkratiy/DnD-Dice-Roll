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
import { MAX_SPIN_STEP, SPIN_SWAP_PERIOD, spinRevealIndex } from './spinReveal.ts'

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
  /**
   * Накопленный угол «кувырка» силуэта (градусы) на фазе scramble. Растёт на
   * постоянный шаг с каждым свапом; поскольку свапы замедляются (ease-out), само
   * вращение визуально тормозит. CSS «дотягивает» поворот за `spinMs`.
   */
  spin?: number
  /** Длительность CSS-перехода поворота = текущий интервал между свапами (мс). */
  spinMs?: number
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
// Скорость «кувырка» силуэта (градусы в миллисекунду): падает по ease от
// стартовой к конечной, отсюда замедление вращения. Эпик ярче: старт быстрее,
// финал медленнее, кривая круче (easeOutEpic).
const SPIN_START_VEL = 3.5
const SPIN_END_VEL = 0.85
const EPIC_SPIN_START_VEL = 5
const EPIC_SPIN_END_VEL = 0.12
// Запас длительности CSS-перехода поворота. Скорость падает в течение интервала,
// поэтому реальное время до следующего свопа больше, чем step/vel «по текущей
// скорости». Множитель >1 гарантирует, что linear-переход не доедет раньше свопа
// и не возникнет паузы-замирания (видно было на медленном хвосте эпика).
const SPIN_MS_SLACK = 1.6
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOut = (t: number) => 1 - (1 - t) * (1 - t)
// Очень крутая замедляющая кривая для эпика (5-я степень): почти всё
// время кубик крутится быстро, затем резко срывается в долгий тягучий хвост —
// последние обороты почти стоят. Контраст «быстро→медленно» максимальный.
const easeOutEpic = (t: number) => 1 - (1 - t) ** 5
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

      const duration =
        BASE_DURATION +
        clamp01(intensity) * MAX_EXTRA_DURATION +
        (epic ? EPIC_EXTRA_DURATION : 0)
      // На эпике вращение стартует быстрее и сильнее замедляется к финалу (крутая
      // кривая easeOutEpic) — резкий контраст «вихрь → величавый докрут».
      const startVel = epic ? EPIC_SPIN_START_VEL : SPIN_START_VEL
      const endVel = epic ? EPIC_SPIN_END_VEL : SPIN_END_VEL
      const ease = epic ? easeOutEpic : easeOut
      const startTime = performance.now()

      // Кадры перебираем ДЕТЕРМИНИРОВАННО по кругу (0→1→2→0…), а не случайно:
      // случайный выбор часто повторял ту же вариацию силуэта подряд («подвисание
      // на месте»), и быстрый перебор не читался как вращение. Счётчик свапов
      // гарантирует, что каждый свап показывает ДРУГОЙ силуэт; смещение по индексу
      // кости (+i) рассинхронизирует кубики, чтобы они не мелькали одинаково.
      // Числа тоже не должны повторяться подряд (14 → 14 выглядит как зависший
      // кадр, особенно при полном обороте, где ждут «раскрытия» нового числа),
      // поэтому помним прошлое значение каждой кости и выбираем заведомо другое.
      let swapCount = 0
      const prevValues: number[] = values.map(() => 0)
      // Случайное число 1..sides, ГАРАНТИРОВАННО отличное от prev (если sides > 1).
      const nextValue = (prev: number): number => {
        if (sides <= 1) return 1
        const r = Math.floor(Math.random() * (sides - 1)) + 1 // 1..sides-1
        return r >= prev ? r + 1 : r // «пропускаем» prev, сдвигая верхний диапазон
      }
      const makeScrambleDice = (): AnimatedDie[] =>
        values.map((_, i) => {
          const value = nextValue(prevValues[i])
          prevValues[i] = value
          return {
            value,
            frameIndex: (swapCount + i) % framesPerDie,
            settled: false,
          }
        })

      // То же, но с ФИНАЛЬНЫМИ значениями: силуэт ещё крутится (settled:false,
      // frameIndex меняется), а число уже задуманное. Используем на последнем
      // видимом обороте, чтобы итог не «выскакивал» в самый конец.
      const makeFinalScrambleDice = (): AnimatedDie[] =>
        values.map((value, i) => ({
          value,
          frameIndex: (swapCount + i) % framesPerDie,
          settled: false,
        }))

      // Угол кувырка интегрируется КАЖДЫЙ кадр (spin += шаг). Но на экране поворот
      // идёт через CSS-transition с запасом SPIN_MS_SLACK, поэтому ОТОБРАЖАЕМЫЙ угол
      // отстаёт от spin. И подмену числа, и его сокрытие считаем по ЭКРАННОМУ углу
      // (shownSpin, ниже) через spinRevealIndex — он меняется в ЦЕНТРЕ скрытой зоны
      // (180°, 540°…), когда грань реально повёрнута «спиной». Индекс зависит только
      // от угла (без счётчика-состояния), а прирост за кадр ограничен MAX_SPIN_STEP —
      // вместе это держит подмену внутри скрытой зоны даже на быстром обороте.
      let spin = 0
      let revealIndex = spinRevealIndex(spin)
      let lastTime = startTime
      // Когда начался ПОСЛЕДНИЙ видимый оборот, переключаемся на финальные значения
      // и больше их не трогаем — итог «приземляется» заранее и плавно докручивается,
      // а не подменяется в последнюю миллисекунду перед settle.
      let landed = false
      // Текущий набор кадров держим в переменной: угол гоним в CSS каждый кадр, а
      // dice пересоздаём лишь при смене revealIndex (раз в оборот, в скрытой фазе) —
      // между свопами переиспользуем тот же объект, чтобы число не менялось на виду.
      let dice = makeScrambleDice()

      const tick = (now: number) => {
        const elapsed = now - startTime
        const progress = clamp01(elapsed / duration)

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

        const dt = now - lastTime
        lastTime = now
        const vel = lerp(startVel, endVel, ease(progress))
        // Прирост угла за кадр ограничиваем MAX_SPIN_STEP, чтобы поворот силуэта
        // оставался плавным и один кадр не «перепрыгивал» целый оборот.
        const step = Math.min(vel * dt, MAX_SPIN_STEP)
        spin += step

        // ЭКРАННЫЙ угол: целевой spin минус отставание CSS-перехода (≈ slack·step) —
        // именно его видит зритель. По нему определяем момент смены числа, чтобы
        // новое значение «вставлялось» ровно когда силуэт на экране проходит ребро.
        const shownSpin = spin - SPIN_MS_SLACK * step

        // Цифра всегда читаема (не крутится и не гаснет). Новое число «вставляем»
        // РАЗ ЗА ОБОРОТ: spinRevealIndex меняется на 180°, 540°… (силуэт ребром) —
        // тогда же перерисовываем dice и показываем другое значение (с лёгким
        // пульсом-появлением в CSS). Сам угол гоним каждый кадр — силуэт крутится плавно.
        const idx = spinRevealIndex(shownSpin)
        if (idx !== revealIndex) {
          revealIndex = idx
          swapCount += 1
          // Прикидываем, сколько ГРАДУСОВ кубик ещё пройдёт до конца времени:
          // средняя скорость на остатке ≈ (текущая + конечная)/2, умноженная на
          // оставшееся время. Если меньше одного периода смены (SPIN_SWAP_PERIOD) —
          // это последний оборот: дальше свопов не будет, поэтому показываем уже
          // финал. Тогда settle не меняет число, и скачка в конце нет.
          if (!landed) {
            const remainingAngle = ((vel + endVel) / 2) * (duration - elapsed)
            if (remainingAngle <= SPIN_SWAP_PERIOD) landed = true
          }
          dice = landed ? makeFinalScrambleDice() : makeScrambleDice()
        }
        // spinMs = время кадра с запасом: переход всегда чуть «не успевает» и
        // прерывается следующим кадром — никаких пауз-замираний и рывков.
        const spinMs = dt * SPIN_MS_SLACK
        setState({ phase: 'scramble', dice, spin, spinMs })

        rafRef.current = requestAnimationFrame(tick)
      }

      // Старт сразу с фазы scramble. Стартовый spinMs маленький (один кадр ~16 мс):
      // первый tick почти сразу перезапишет его реальным dt — важно лишь не задать
      // большую длительность, иначе первый поворот «наезжал» бы плавно издалека.
      setState({ phase: 'scramble', dice, spin: 0, spinMs: 16 })
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
