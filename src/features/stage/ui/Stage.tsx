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
import { useShuffleBag } from '@shared/lib'
import { useLanguage, useT } from '@shared/locale'
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
  /** Отброшенная кость пула (проигравший бросок при adv/dis) — рисуем приглушённо. */
  isDropped: boolean
}

export function Stage({ request, rollSource, reducedMotion, onResult, classId }: StageProps) {
  const { lang } = useLanguage()
  const t = useT()
  const { animation, isPressing, intensity, handlers, lastResult, isRolling, droppedFlags } = useStageRoll({
    request,
    rollSource,
    reducedMotion,
    onResult,
  })

  // Реплики героя по классу. Фразу выбираем один раз на вход в фазу (тряска /
  // бросок), чтобы текст не «мерцал» на каждом кадре, и обновляем для каждого
  // нового жеста. Используем паттерн «корректировка состояния во время рендера»
  // (без эффекта): отслеживаем фронт перехода в фазу по предыдущему значению.
  //
  // Выбор фразы идёт через «мешок» (useShuffleBag): каждая реплика показывается
  // один раз за круг — это убирает частые повторы, свойственные «голому» random.
  const phrases = useMemo(() => getClassPhrases(classId, lang), [classId, lang])
  const nextShakePhrase = useShuffleBag(phrases.shake)
  const nextReleasePhrase = useShuffleBag(phrases.release)
  const nextSuccessPhrase = useShuffleBag(phrases.success)
  const nextFailPhrase = useShuffleBag(phrases.fail)
  const [shakePhrase, setShakePhrase] = useState(() => nextShakePhrase())
  const [releasePhrase, setReleasePhrase] = useState(() => nextReleasePhrase())

  const [wasPressing, setWasPressing] = useState(isPressing)
  if (isPressing !== wasPressing) {
    setWasPressing(isPressing)
    if (isPressing) {
      setShakePhrase(nextShakePhrase())
    }
  }

  const [wasRolling, setWasRolling] = useState(isRolling)
  if (isRolling !== wasRolling) {
    setWasRolling(isRolling)
    if (isRolling) {
      setReleasePhrase(nextReleasePhrase())
    }
  }

  // Критический исход d20: имеет смысл только для одиночного d20 (одна
  // учитываемая кость). Натуральная 20 — крит-успех, натуральная 1 — крит-провал.
  const critKind: 'success' | 'fail' | null = useMemo(() => {
    if (!lastResult || request.die !== 'd20' || lastResult.dice.length !== 1) {
      return null
    }
    const value = lastResult.dice[0].value
    if (value === 20) return 'success'
    if (value === 1) return 'fail'
    return null
  }, [lastResult, request.die])

  // Реплику на крит выбираем один раз на новый результат (по его id), чтобы текст
  // не пересчитывался на каждом кадре анимации.
  const [critPhrase, setCritPhrase] = useState<string | null>(null)
  const [lastResultId, setLastResultId] = useState(lastResult?.id)
  if (lastResult?.id !== lastResultId) {
    setLastResultId(lastResult?.id)
    if (critKind === 'success') {
      setCritPhrase(nextSuccessPhrase())
    } else if (critKind === 'fail') {
      setCritPhrase(nextFailPhrase())
    } else {
      setCritPhrase(null)
    }
  }

  // Что рисуем: кадры анимации либо «покоящиеся» кубики с максимумом номинала.
  // При adv/dis анимация несёт весь пул (порядок перемешан в хуке). Отметку «отброшенная»
  // берём из droppedFlags по позиции. Приглушаем проигравших начиная с фазы reveal
  // (когда «расчёт» завершён) и оставляем затенёнными после неё — но НЕ во время
  // scramble/settle, чтобы не выдавать победителя раньше времени.
  const dimLosers = animation.phase !== 'scramble' && animation.phase !== 'settle'
  const viewDice: ViewDie[] = useMemo(() => {
    if (animation.dice.length > 0) {
      return animation.dice.map((d, index) => ({
        value: d.value,
        frameIndex: d.frameIndex,
        isDropped: droppedFlags[index] === true,
      }))
    }
    // До броска показываем максимальное значение кубика (число граней).
    const maxValue = getDieSides(request.die)
    return Array.from({ length: request.count }, () => ({
      value: maxValue,
      frameIndex: 0,
      isDropped: false,
    }))
  }, [animation.dice, request.count, request.die, droppedFlags])

  const getEmphasis = (value: number | null, isDropped: boolean): DieEmphasis => {
    const revealing = animation.phase === 'reveal' || animation.phase === 'settle'
    // Крит подсвечиваем только у учитываемой кости — проигравший натуральный 20/1
    // не должен вспыхивать цветом крита.
    if (revealing && !isDropped && request.die === 'd20' && value === 20) {
      return 'critSuccess'
    }
    if (revealing && !isDropped && request.die === 'd20' && value === 1) {
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
    <section className={styles.stage} aria-label={t.stage.sceneAria}>
      {/* Обёртка-резерв держит в потоке высоту самого «высокого» расклада d20 (3
       * кубика в две строки), а сама карточка-трей лежит внутри как absolute и
       * прижата к НИЗУ резерва. Поэтому карточка по высоте равна своему
       * содержимому (без пустого верха внутри) и растёт ВВЕРХ, а контролы под
       * сценой не съезжают при смене числа кубиков. Свободное место над невысокой
       * карточкой — прозрачное (сцена просто опущена вниз). */}
      <div className={styles.trayReserve}>
        <div
          className={`${styles.tray} ${isPressing ? styles.shaking : ''} ${
            reducedMotion ? styles.still : ''
          }`}
          style={{ '--shake': intensity } as React.CSSProperties}
          role="button"
          tabIndex={0}
          aria-label={t.stage.trayAria}
          aria-busy={isRolling}
          {...handlers}
        >
          <div className={styles.dice}>
            {viewDice.map((d, index) => (
              <Die
                key={index}
                die={request.die}
                value={d.value}
                frameIndex={d.frameIndex}
                emphasis={getEmphasis(d.value, d.isDropped)}
                size={dieSize}
                className={`${isPressing ? styles.jitter : reducedMotion ? '' : styles.glow} ${
                  d.isDropped && dimLosers ? styles.droppedDie : ''
                }`.trim()}
              />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.readout} aria-live="polite">
        {showTotal ? (
          <span className={styles.total}>
            {critPhrase ? (
              <span
                className={critKind === 'success' ? styles.critSuccess : styles.critFail}
              >
                {critPhrase}
              </span>
            ) : null}
            <span className={styles.resultLabel}>{t.stage.resultLabel}</span>
            {lastResult.total}
            {lastResult.dice.length > 1 || request.modifier !== 0 ? (
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
          <span className={styles.hint}>{t.stage.hint}</span>
        )}
      </div>
    </section>
  )
}
