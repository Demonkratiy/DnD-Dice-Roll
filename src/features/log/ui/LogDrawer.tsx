/**
 * LogDrawer — выезжающая снизу панель с историей бросков.
 * Хэндл-«око с книгой» открывает/закрывает панель. Данные приходят пропсами (app-слой).
 */

import { Drawer } from '@shared/ui'
import type { RollResult } from '@entities/roll'
import { useT } from '@shared/locale'
import styles from './LogDrawer.module.css'

/**
 * Иконка-«всевидящее око» с раскрытой книгой вместо зрачка: плоский линейный SVG
 * в стиле силуэтов кубиков. Цвет наследуется из `currentColor`
 * (на хэндле — `--accent-contrast`).
 */
function EyeBookIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="70 120 372 272"
      fill="none"
      stroke="currentColor"
      strokeWidth="18"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Контур глаза */}
      <path d="M84 256C132 190 202 154 256 154C310 154 380 190 428 256C380 322 310 358 256 358C202 358 132 322 84 256Z" />
      {/* Книга-зрачок: корешок + две страницы */}
      <path d="M256 206 L256 312" />
      <path d="M256 212 Q230 198 206 208 L206 306 Q230 296 256 310" />
      <path d="M256 212 Q282 198 306 208 L306 306 Q282 296 256 310" />
    </svg>
  )
}

export interface LogDrawerProps {
  entries: RollResult[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onClear: () => void
}

function formatNotation(result: RollResult): string {
  const { count, die, modifier, mode } = result.request
  const base = `${count}${die}`
  const mod = modifier !== 0 ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : ''
  const modeMark =
    mode === 'advantage' ? ' ⬆' : mode === 'disadvantage' ? ' ⬇' : ''
  return `${base}${mod}${modeMark}`
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function LogDrawer({ entries, open, onOpenChange, onClear }: LogDrawerProps) {
  const t = useT()
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      handleIcon={<EyeBookIcon />}
      handleLabel={t.log.handleLabel}
      title={t.log.title}
    >
      {entries.length === 0 ? (
        <p className={styles.empty}>{t.log.empty}</p>
      ) : (
        <>
          <button type="button" className={styles.clear} onClick={onClear}>
            {t.log.clear}
          </button>
          <ul className={styles.list}>
            {entries.map((entry) => (
              <li key={entry.id} className={styles.item}>
                <span className={styles.notation}>{formatNotation(entry)}</span>
                <span className={styles.dice}>
                  {entry.dice.map((roll) => roll.value).join(', ')}
                </span>
                <span className={styles.total}>{entry.total}</span>
                <span className={styles.meta}>
                  {entry.author.name} · {formatTime(entry.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Drawer>
  )
}
