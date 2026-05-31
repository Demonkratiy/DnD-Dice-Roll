/**
 * Die — визуальное представление кубика: плоский SVG-силуэт + число по центру.
 *
 * Компонент «глупый»: он лишь рисует переданный кадр (вариацию силуэта) и значение.
 * Какой кадр и какое число показать в каждый момент — решает анимация броска
 * (useRollAnimation) или родитель (лента выбора номинала).
 *
 * Все цвета берутся из CSS-переменных темы (var(--die-*)), поэтому смена темы
 * автоматически перекрашивает кубик.
 */

import { useMemo } from 'react'
import { getDieFrames } from './geometry.ts'
import type { DieType } from '../model/types.ts'
import styles from './Die.module.css'

/** Визуальное состояние кубика (влияет на подсветку/эффекты). */
export type DieEmphasis = 'idle' | 'scramble' | 'reveal' | 'critSuccess' | 'critFail'

export interface DieProps {
  die: DieType
  /** Индекс показываемой вариации силуэта. */
  frameIndex?: number
  /** Число на кубике; `null`/`undefined` — без числа. */
  value?: number | null
  /** Выбранный кубик (ореол + чуть крупнее) — для ленты выбора. */
  selected?: boolean
  /** Состояние для визуальных акцентов. */
  emphasis?: DieEmphasis
  /** Размер в пикселях (ширина = высота). */
  size?: number
  /** Доп. класс. */
  className?: string
}

export function Die({
  die,
  frameIndex = 0,
  value = null,
  selected = false,
  emphasis = 'idle',
  size = 96,
  className,
}: DieProps) {
  const frames = useMemo(() => getDieFrames(die), [die])
  const frame = frames[((frameIndex % frames.length) + frames.length) % frames.length]

  const classes = [
    styles.die,
    selected ? styles.selected : '',
    styles[emphasis] ?? '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <svg
      className={classes}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={value != null ? `${die}: ${value}` : die}
    >
      <polygon
        className={styles.shape}
        points={frame.points}
        strokeLinejoin="round"
      />
      {value != null && (
        <text className={styles.value} x="50" y="52" dominantBaseline="middle">
          {value}
        </text>
      )}
    </svg>
  )
}
