/**
 * Drawer — нижняя выезжающая панель с хэндлом.
 *
 * Хэндл всегда виден внизу по центру. Тап по нему — открыть/закрыть; свайп вверх —
 * открыть, свайп вниз — закрыть. Открытая панель наезжает ПОВЕРХ контента и
 * закрывается по тапу на фон.
 */

import { useRef, type PointerEvent, type ReactNode } from 'react'
import styles from './Drawer.module.css'

export interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Иконка/символ на хэндле. */
  handleIcon: ReactNode
  handleLabel: string
  title?: string
  children: ReactNode
}

const SWIPE_THRESHOLD = 40

export function Drawer({
  open,
  onOpenChange,
  handleIcon,
  handleLabel,
  title,
  children,
}: DrawerProps) {
  const startYRef = useRef<number | null>(null)

  const onHandlePointerDown = (event: PointerEvent) => {
    startYRef.current = event.clientY
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const onHandlePointerUp = (event: PointerEvent) => {
    const startY = startYRef.current
    startYRef.current = null
    if (startY == null) {
      return
    }
    const delta = event.clientY - startY
    if (delta <= -SWIPE_THRESHOLD) {
      onOpenChange(true)
    } else if (delta >= SWIPE_THRESHOLD) {
      onOpenChange(false)
    } else {
      onOpenChange(!open)
    }
  }

  return (
    <div className={styles.root}>
      {open && (
        <div
          className={styles.backdrop}
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
      )}

      <div className={`${styles.panel} ${open ? styles.open : ''}`} role="dialog" aria-hidden={!open}>
        <button
          type="button"
          className={styles.handle}
          aria-label={handleLabel}
          aria-expanded={open}
          title={handleLabel}
          onPointerDown={onHandlePointerDown}
          onPointerUp={onHandlePointerUp}
        >
          <span className={styles.handleIcon}>{handleIcon}</span>
        </button>

        <div className={`${styles.body} ${open ? '' : styles.bodyHidden}`}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {children}
        </div>
      </div>
    </div>
  )
}
