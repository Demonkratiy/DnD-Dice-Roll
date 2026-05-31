/**
 * useStageRoll — оркестратор сцены броска.
 *
 * Связывает три части:
 *  - жест (usePressAndShake): зажать/потрясти/отпустить;
 *  - источник броска (RollSource): честный результат (сейчас локальный, позже сетевой);
 *  - анимацию (useRollAnimation): scramble → settle → reveal.
 *
 * Поток: отпускание жеста → запрос честного броска → запуск анимации по полученным
 * значениям с интенсивностью из жеста → на фазе reveal отдаём результат наружу.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  useRollAnimation,
  usePressAndShake,
  type RollAnimationState,
  type PressAndShakeHandlers,
} from '@shared/lib'
import type { RollSource } from '@shared/services'
import { getDieSides } from '@entities/die'
import { FRAMES_PER_DIE } from '@entities/die'
import type { RollRequest, RollResult } from '@entities/roll'

export interface UseStageRollParams {
  request: RollRequest
  rollSource: RollSource
  reducedMotion?: boolean
  /** Вызывается один раз на фазе reveal с честным результатом. */
  onResult?: (result: RollResult) => void
}

export interface UseStageRollResult {
  animation: RollAnimationState
  isPressing: boolean
  intensity: number
  handlers: PressAndShakeHandlers
  /** Последний показанный результат (для тотала/крита на сцене). */
  lastResult: RollResult | null
  /** Идёт ли сейчас бросок/анимация (жест заблокирован). */
  isRolling: boolean
}

export function useStageRoll({
  request,
  rollSource,
  reducedMotion = false,
  onResult,
}: UseStageRollParams): UseStageRollResult {
  const { state: animation, start, reset } = useRollAnimation({
    framesPerDie: FRAMES_PER_DIE,
    reducedMotion,
  })

  const [lastResult, setLastResult] = useState<RollResult | null>(null)
  const pendingRef = useRef<RollResult | null>(null)
  const isRolling = animation.phase === 'scramble' || animation.phase === 'settle'

  // При смене параметров броска (кубик/количество/модификатор/режим) сбрасываем
  // прошлый результат и кадры анимации — иначе на сцене останутся «чужие» значения
  // и старое количество кубиков до следующего броска. Используем рекомендованный
  // React-паттерн «корректировка состояния во время рендера» (без эффекта).
  const { die, count, modifier, mode } = request
  const signature = `${die}|${count}|${modifier}|${mode}`
  const [activeSignature, setActiveSignature] = useState(signature)
  if (signature !== activeSignature) {
    setActiveSignature(signature)
    reset()
    setLastResult(null)
  }

  const handleRelease = useCallback(
    async (intensity: number) => {
      const result = await rollSource.roll(request)
      pendingRef.current = result
      start({
        values: result.dice.map((roll) => roll.value),
        sides: getDieSides(request.die),
        intensity,
      })
    },
    [rollSource, request, start],
  )

  const press = usePressAndShake({
    onRelease: handleRelease,
    disabled: isRolling,
  })

  // На фазе reveal публикуем результат ровно один раз.
  useEffect(() => {
    if (animation.phase === 'reveal' && pendingRef.current) {
      const result = pendingRef.current
      pendingRef.current = null
      setLastResult(result)
      onResult?.(result)
    }
  }, [animation.phase, onResult])

  return {
    animation,
    isPressing: press.isPressing,
    intensity: press.intensity,
    handlers: press.handlers,
    lastResult,
    isRolling,
  }
}
