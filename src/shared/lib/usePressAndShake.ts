/**
 * usePressAndShake — жест «зажать и потрясти» для броска кубика.
 *
 * Поведение:
 *  - короткий тап/клик  → быстрый бросок (малая интенсивность);
 *  - зажатие            → кубик «трясётся», интенсивность растёт со временем;
 *  - отпускание         → запускается бросок, интенсивность передаётся анимации.
 *
 * Интенсивность (0..1) зависит от длительности зажатия и влияет ТОЛЬКО на
 * длительность/динамику анимации, но не на результат броска.
 *
 * Доступность: Space/Enter выполняют бросок с клавиатуры (как короткий тап).
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'

/** За сколько мс удержания интенсивность достигает максимума. */
const MAX_PRESS_MS = 1500
/** Интенсивность для короткого тапа/клавиатуры. */
const TAP_INTENSITY = 0.12

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export interface UsePressAndShakeOptions {
  /** Вызывается при отпускании/тапе с итоговой интенсивностью 0..1. */
  onRelease: (intensity: number) => void
  /** Блокировка жеста (например, во время уже идущей анимации). */
  disabled?: boolean
}

export interface PressAndShakeHandlers {
  onPointerDown: (event: PointerEvent) => void
  onPointerUp: (event: PointerEvent) => void
  onPointerCancel: (event: PointerEvent) => void
  onKeyDown: (event: KeyboardEvent) => void
}

export interface UsePressAndShakeResult {
  /** Идёт ли сейчас зажатие. */
  isPressing: boolean
  /** Текущая (растущая) интенсивность зажатия 0..1 — для визуала тряски. */
  intensity: number
  /** Обработчики для навешивания на интерактивный элемент сцены. */
  handlers: PressAndShakeHandlers
}

export function usePressAndShake({
  onRelease,
  disabled = false,
}: UsePressAndShakeOptions): UsePressAndShakeResult {
  const [isPressing, setIsPressing] = useState(false)
  const [intensity, setIntensity] = useState(0)

  const startTimeRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  useEffect(() => stopLoop, [stopLoop])

  const computeIntensity = useCallback(
    () => clamp01((performance.now() - startTimeRef.current) / MAX_PRESS_MS),
    [],
  )

  const beginPress = useCallback(() => {
    startTimeRef.current = performance.now()
    setIsPressing(true)
    setIntensity(0)

    const loop = () => {
      setIntensity(computeIntensity())
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [computeIntensity])

  const endPress = useCallback(
    (release: boolean) => {
      if (!isPressing) {
        return
      }
      stopLoop()
      const finalIntensity = computeIntensity()
      setIsPressing(false)
      setIntensity(0)
      if (release) {
        onRelease(Math.max(finalIntensity, TAP_INTENSITY))
      }
    },
    [isPressing, stopLoop, computeIntensity, onRelease],
  )

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      if (disabled) {
        return
      }
      // Захватываем указатель, чтобы получить pointerup даже вне элемента.
      event.currentTarget.setPointerCapture?.(event.pointerId)
      beginPress()
    },
    [disabled, beginPress],
  )

  const onPointerUp = useCallback(() => endPress(true), [endPress])
  const onPointerCancel = useCallback(() => endPress(false), [endPress])

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) {
        return
      }
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        onRelease(TAP_INTENSITY)
      }
    },
    [disabled, onRelease],
  )

  return {
    isPressing,
    intensity,
    handlers: { onPointerDown, onPointerUp, onPointerCancel, onKeyDown },
  }
}
