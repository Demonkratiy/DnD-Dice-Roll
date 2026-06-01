/**
 * Stage — главная сцена: крупные кубики, которыми бросают жестом.
 *
 * Тап по сцене = бросок, зажатие = тряска (кубики подрагивают, амплитуда растёт
 * с интенсивностью), отпускание = перебор форм и показ результата. При нескольких
 * кубиках во время тряски они хаотично подрагивают каждый по-своему.
 */

import { useMemo, useState } from 'react'
import { Die, getDieSides, type DieEmphasis } from '@entities/die'
import type { RollRequest, RollResult } from '@entities/roll'
import { getClassPhrases, type PlayerClassId } from '@entities/player'
import type { RollSource } from '@shared/services'
import { useStageRoll } from '../model/useStageRoll.ts'
import styles from './Stage.module.css'

export interface StageProps {
  request: RollRequest
  rollSource: RollSource
  reducedMotion?: boolean
  onResult?: (result: RollResult) => void
  /** Класс героя — определяет набор реплик во время броска. */
  classId?: PlayerClassId
}

interface ViewDie {
  value: number | null
  frameIndex: number
}

/** Случайный элемент непустого массива (для выбора реплики героя). */
function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export function Stage({ request, rollSource, reducedMotion, onResult, classId }: StageProps) {
  const { animation, isPressing, intensity, handlers, lastResult, isRolling } = useStageRoll({
    request,
    rollSource,
    reducedMotion,
    onResult,
  })

  // Реплики героя по классу. Фразу выбираем один раз на вход в фазу (тряска /
  // бросок), чтобы текст не «мерцал» на каждом кадре, и обновляем для каждого
  // нового жеста. Используем паттерн «корректировка состояния во время рендера»
  // (без эффекта): отслеживаем фронт перехода в фазу по предыдущему значению.
  const phrases = useMemo(() => getClassPhrases(classId), [classId])
  const [shakePhrase, setShakePhrase] = useState(() => pickRandom(phrases.shake))
  const [releasePhrase, setReleasePhrase] = useState(() => pickRandom(phrases.release))

  const [wasPressing, setWasPressing] = useState(isPressing)
  if (isPressing !== wasPressing) {
    setWasPressing(isPressing)
    if (isPressing) {
      setShakePhrase(pickRandom(phrases.shake))
    }
  }

  const [wasRolling, setWasRolling] = useState(isRolling)
  if (isRolling !== wasRolling) {
    setWasRolling(isRolling)
    if (isRolling) {
      setReleasePhrase(pickRandom(phrases.release))
    }
  }

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

  const showTotal = lastResult != null && !isRolling && !isPressing
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
            <span className={styles.resultLabel}>Результат:</span>
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
        ) : isPressing ? (
          <span className={styles.status}>{shakePhrase}</span>
        ) : isRolling ? (
          <span className={styles.status}>{releasePhrase}</span>
        ) : (
          <span className={styles.hint}>Нажми кубик, чтобы бросить · зажми и потряси</span>
        )}
      </div>
    </section>
  )
}
