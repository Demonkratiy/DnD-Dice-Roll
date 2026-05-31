/**
 * LogDrawer — выезжающая снизу панель с историей бросков.
 * Хэндл-«перо» открывает/закрывает панель. Данные приходят пропсами (app-слой).
 */

import { Drawer } from '@shared/ui'
import type { RollResult } from '@entities/roll'
import styles from './LogDrawer.module.css'

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
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      handleIcon="✒️"
      handleLabel="История бросков"
      title="История бросков"
    >
      {entries.length === 0 ? (
        <p className={styles.empty}>Пока нет бросков. Брось кубик!</p>
      ) : (
        <>
          <button type="button" className={styles.clear} onClick={onClear}>
            Очистить
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
