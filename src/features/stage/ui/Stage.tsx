/**
 * Stage — главная сцена: крупные кубики, которыми бросают жестом.
 *
 * Тап по сцене = бросок, зажатие = тряска (кубики подрагивают, амплитуда растёт
 * с интенсивностью), отпускание = перебор форм и показ результата. При нескольких
 * кубиках во время тряски они хаотично подрагивают каждый по-своему.
 */

import { useMemo } from 'react'
import { Die, getDieSides, type DieEmphasis } from '@entities/die'
import type { RollRequest, RollResult } from '@entities/roll'
import type { RollSource } from '@shared/services'
import { useStageRoll } from '../model/useStageRoll.ts'
import styles from './Stage.module.css'

export interface StageProps {
  request: RollRequest
  rollSource: RollSource
  reducedMotion?: boolean
  onResult?: (result: RollResult) => void
}

interface ViewDie {
  value: number | null
  frameIndex: number
}

export function Stage({ request, rollSource, reducedMotion, onResult }: StageProps) {
  const { animation, isPressing, intensity, handlers, lastResult, isRolling } = useStageRoll({
    request,
    rollSource,
    reducedMotion,
    onResult,
  })

  // Что рисуем: кадры анимации либо «покоящиеся» кубики с максимумом номинала.
  const viewDice: ViewDie[] = useMemo(() => {
    if (animation.dice.length > 0) {
      return animation.dice.map((d) => ({ value: d.value, frameIndex: d.frameIndex }))
    }
    // До броска показываем максимальное значение кубика (число граней).
    const maxValue = getDieSides(request.die)
    return Array.from({ length: request.count }, () => ({ value: maxValue, frameIndex: 0 }))
  }, [animation.dice, request.count, request.die])

  const getEmphasis = (value: number | null): DieEmphasis => {
    const revealing = animation.phase === 'reveal' || animation.phase === 'settle'
    if (revealing && request.die === 'd20' && value === 20) {
      return 'critSuccess'
    }
    if (revealing && request.die === 'd20' && value === 1) {
      return 'critFail'
    }
    if (animation.phase === 'scramble') {
      return 'scramble'
    }
    if (animation.phase === 'reveal') {
      return 'reveal'
    }
    return 'idle'
  }

  const showTotal = lastResult != null && !isRolling
  const dieSize = viewDice.length > 4 ? 72 : viewDice.length > 1 ? 96 : 132

  return (
    <section className={styles.stage} aria-label="Сцена броска">
      <div
        className={`${styles.tray} ${isPressing ? styles.shaking : ''} ${
          reducedMotion ? styles.still : ''
        }`}
        style={{ '--shake': intensity } as React.CSSProperties}
        role="button"
        tabIndex={0}
        aria-label="Бросить кубики: тап — бросок, зажать и потрясти — эффектный бросок"
        aria-busy={isRolling}
        {...handlers}
      >
        {viewDice.map((d, index) => (
          <Die
            key={index}
            die={request.die}
            value={d.value}
            frameIndex={d.frameIndex}
            emphasis={getEmphasis(d.value)}
            size={dieSize}
            className={isPressing ? styles.jitter : reducedMotion ? undefined : styles.glow}
          />
        ))}
      </div>

      <div className={styles.readout} aria-live="polite">
        {showTotal ? (
          <span className={styles.total}>
            {lastResult.total}
            {request.count > 1 || request.modifier !== 0 ? (
              <span className={styles.breakdown}>
                {lastResult.dice.map((r) => r.value).join(' + ')}
                {request.modifier !== 0
                  ? ` ${request.modifier > 0 ? '+' : '−'} ${Math.abs(request.modifier)}`
                  : ''}
              </span>
            ) : null}
          </span>
        ) : (
          <span className={styles.hint}>Нажми кубик, чтобы бросить · зажми и потряси</span>
        )}
      </div>
    </section>
  )
}
