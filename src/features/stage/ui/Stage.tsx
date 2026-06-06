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
import { useShuffleBag, getPressTier } from '@shared/lib'
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
  /** Подписанный угол поворота этого кубика (градусы) — у каждого своё направление/темп. */
  rot: number
  /** Длительность CSS-перехода поворота этого кубика (мс). */
  rotMs: number
}

/**
 * Эпические искры — декоративные точки, разлетающиеся от центра сцены на пике
 * зажатия (тир `epic`). Набор фиксированный и детерминированный (без Math.random):
 * угол, дистанция, задержка и размер выводятся из индекса, чтобы искры стартовали
 * вразнобой и слой не «дышал» одинаково. Чистая косметика — гасится при
 * reduced-motion (искры вообще не рендерятся, см. условие isEpic).
 */
const EPIC_SPARKS = Array.from({ length: 14 }, (_, i) => ({
  angle: (360 / 14) * i + (i % 3) * 9,
  dist: 96 + (i % 4) * 24,
  delay: (i % 7) * 0.1,
  size: 4 + (i % 3) * 2,
}))

/**
 * Геометрия рунического «следа мощи» — печати под кубиком на крит-исходе
 * (натуральная 20/1). Лучи-засечки идут по кругу (12 штук), трещины расходятся от
 * центра под смещёнными углами. Всё детерминировано (углы из индекса), сам слой —
 * декоративный (aria-hidden) и не рендерится под reduced-motion.
 */
const RUNE_RAYS = Array.from({ length: 12 }, (_, i) => (360 / 12) * i)
const RUNE_CRACKS = [18, 78, 138, 198, 258, 318]

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
  const nextEpicPhrase = useShuffleBag(phrases.epic)
  const nextSuccessPhrase = useShuffleBag(phrases.success)
  const nextFailPhrase = useShuffleBag(phrases.fail)
  const [shakePhrase, setShakePhrase] = useState(() => nextShakePhrase())
  const [releasePhrase, setReleasePhrase] = useState(() => nextReleasePhrase())
  const [epicPhrase, setEpicPhrase] = useState(() => nextEpicPhrase())

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
        rot: d.rot ?? 0,
        rotMs: d.rotMs ?? 0,
      }))
    }
    // До броска показываем максимальное значение кубика (число граней).
    const maxValue = getDieSides(request.die)
    return Array.from({ length: request.count }, () => ({
      value: maxValue,
      frameIndex: 0,
      isDropped: false,
      rot: 0,
      rotMs: 0,
    }))
  }, [animation.dice, request.count, request.die, droppedFlags])

  const getEmphasis = (value: number | null, isDropped: boolean): DieEmphasis => {
    // Крит-цвет держим не только в момент показа (settle/reveal), но и в покое
    // (idle) — пока кубик «отдыхает» на крит-результате до следующего броска.
    // До первого броска dice пуст (показываем грань-максимум), поэтому idle без
    // костей НЕ подсвечиваем, иначе стартовая «20» сразу вспыхнула бы критом.
    // При зажатии (новый бросок ещё в idle, но кости старые) крит-цвет тоже
    // сбрасываем — синхронно с руной (`critAftermath` тоже исключает isPressing),
    // иначе цифра оставалась бы крит-цветной всю тряску до отпускания.
    const revealing =
      animation.phase === 'reveal' ||
      animation.phase === 'settle' ||
      (animation.phase === 'idle' && animation.dice.length > 0 && !isPressing)
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

  // Эпический режим — единственная ДИСКРЕТНАЯ фаза (CSS-класс .epic): при ~3 c
  // зажатия свечение скачком «пробивается» в эпик. Фазы normal/charged живут на
  // непрерывном континууме --shake (см. .shaking в CSS), поэтому переход 1→2
  // плавный, без отдельного класса. Под «уменьшить движение» эпик не включаем.
  const isEpic = isPressing && !reducedMotion && getPressTier(intensity) === 'epic'

  // Разовый «след мощи»: рунический круг под кубиком на КРИТ-исходе (натуральная
  // 20 — успех, 1 — провал) в любом режиме броска. Крит считаем по ВИДИМОЙ кости
  // (а не по lastResult, который во время settle ещё хранит прошлый бросок),
  // поэтому руна точно совпадает с показанным числом. Скоупим одиночным d20
  // (dice.length === 1: исключает adv/dis и состояние «до броска»). Во время
  // scramble не показываем — число там случайное.
  const displayCrit: 'success' | 'fail' | null = useMemo(() => {
    if (request.die !== 'd20' || animation.dice.length !== 1) return null
    if (animation.phase === 'scramble') return null
    const value = animation.dice[0].value
    if (value === 20) return 'success'
    if (value === 1) return 'fail'
    return null
  }, [request.die, animation.dice, animation.phase])

  // Руна «залипает»: появляется на крите и остаётся под кубиком до начала
  // следующего броска (displayCrit обнуляется на scramble) или до зажатия для
  // нового броска. Под reducedMotion не показываем — это чисто декоративная вспышка.
  const critAftermath = !reducedMotion && displayCrit != null && !isPressing

  // Когда зажатие пробивается в эпик-тир, подменяем обычную реплику тряски на
  // драматичную (`phrases.epic`). Фразу выбираем один раз на фронте входа в эпик
  // — по тому же паттерну «корректировки состояния во время рендера».
  const [wasEpic, setWasEpic] = useState(isEpic)
  if (isEpic !== wasEpic) {
    setWasEpic(isEpic)
    if (isEpic) {
      setEpicPhrase(nextEpicPhrase())
    }
  }

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
            isEpic ? styles.epic : ''
          } ${reducedMotion ? styles.still : ''}`}
          style={{ '--shake': intensity } as React.CSSProperties}
          role="button"
          tabIndex={0}
          aria-label={t.stage.trayAria}
          aria-busy={isRolling}
          {...handlers}
        >
          {/* Рунический «след мощи» — разовая печать под кубиком на КРИТ-исходе
           * (натуральная 20/1) в любом режиме. Цвет — по типу крита. */}
          {critAftermath ? (
            <svg
              className={`${styles.runeMark} ${
                displayCrit === 'success' ? styles.runeSuccess : styles.runeFail
              }`}
              viewBox="0 0 200 200"
              aria-hidden="true"
            >
              <circle className={styles.runeRing} cx="100" cy="100" r="80" />
              <circle className={styles.runeRingInner} cx="100" cy="100" r="58" />
              {RUNE_RAYS.map((a) => (
                <line
                  key={`ray-${a}`}
                  className={styles.runeTick}
                  x1="100"
                  y1="22"
                  x2="100"
                  y2="8"
                  transform={`rotate(${a} 100 100)`}
                />
              ))}
              {RUNE_CRACKS.map((a) => (
                <line
                  key={`crack-${a}`}
                  className={styles.runeCrack}
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="56"
                  transform={`rotate(${a} 100 100)`}
                />
              ))}
            </svg>
          ) : null}
          {/* Поворот теперь ПОКУБИЧНЫЙ: у каждого своя длительность и
           * направление, поэтому CSS-переменные угла живут на самом <Die>, а не
           * на общем контейнере. */}
          <div className={`${styles.dice} ${isEpic ? styles.epicDistort : ''}`.trim()}>
            {viewDice.map((d, index) => (
              <Die
                key={index}
                die={request.die}
                value={d.value}
                frameIndex={d.frameIndex}
                emphasis={getEmphasis(d.value, d.isDropped)}
                size={dieSize}
                style={
                  {
                    '--die-rot': `${d.rot}deg`,
                    '--die-rot-ms': `${d.rotMs}ms`,
                  } as React.CSSProperties
                }
                className={`${isPressing ? styles.jitter : reducedMotion ? '' : styles.glow} ${
                  d.isDropped && dimLosers ? styles.droppedDie : ''
                }`.trim()}
              />
            ))}
          </div>
          {/* Эпические искры — разлетаются от центра только на пике зажатия.
           * Чистая декорация (aria-hidden); под reduced-motion isEpic ложен, так
           * что слой не рендерится вовсе. */}
          {isEpic ? (
            <div className={styles.sparks} aria-hidden="true">
              {EPIC_SPARKS.map((s, i) => (
                <span
                  key={i}
                  className={styles.spark}
                  style={
                    {
                      '--spark-angle': `${s.angle}deg`,
                      '--spark-dist': `${s.dist}px`,
                      '--spark-delay': `${s.delay}s`,
                      '--spark-size': `${s.size}px`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          ) : null}
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
          <span className={styles.status}>{isEpic ? epicPhrase : shakePhrase}</span>
        ) : isRolling ? (
          <span className={styles.status}>{releasePhrase}</span>
        ) : (
          <span className={styles.hint}>{t.stage.hint}</span>
        )}
      </div>
    </section>
  )
}
