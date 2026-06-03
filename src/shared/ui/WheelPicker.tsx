/**
 * WheelPicker — вертикальный «барабан» выбора одного значения из списка.
 *
 * Зачем: компактная альтернатива Segmented, когда вариантов несколько и они не
 * влезают в строку (на мобильном). В покое барабан схлопнут до одного пункта (вровень
 * с соседними контролами) и раскрывается до трёх видимых при наведении/фокусе —
 * экономит место на экране и не растёт от числа опций.
 *
 * Как устроено: нативный скролл-контейнер с CSS Scroll Snap. Браузер сам
 * обеспечивает прилипание к пунктам и тач-инерцию — поэтому JS минимален: мы лишь
 *  - синхронизируем внешнее `value` → позицию скролла;
 *  - по окончании скролла вычисляем центральный пункт → `onChange`;
 *  - подсвечиваем активный пункт и приглушаем соседние по дистанции от центра;
 *  - перехватываем колесо мыши и шагаем ровно на один пункт за «щелчок».
 *
 * Опциональный `railLabel` — декоративная подпись в «мёртвых зонах» (крайние
 * положения), проступает только там, где под/над лентой нет пунктов.
 *
 * Доступность: `role="radiogroup"`, стрелки ↑/↓ листают, активный пункт помечен
 * `aria-checked`, фокус-кольцо — акцентом темы.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import styles from './WheelPicker.module.css'

export interface WheelPickerOption<T extends string> {
  value: T
  label: string
}

export interface WheelPickerProps<T extends string> {
  label: string
  options: WheelPickerOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Декоративная подпись в «мёртвых зонах» барабана (крайние положения). */
  railLabel?: string
}

/** Высота одного пункта (px). Должна совпадать с --wheel-item-height в CSS. */
const ITEM_HEIGHT = 40

export function WheelPicker<T extends string>({
  label,
  options,
  value,
  onChange,
  railLabel,
}: WheelPickerProps<T>) {
  const groupId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Чтобы программный скролл (синхронизация по value) не порождал «эхо» onChange.
  const isSyncingRef = useRef(false)
  // Троттл-замок для прокрутки колесом мыши: один шаг за «щелчок».
  const wheelLockRef = useRef(false)

  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const [activeIndex, setActiveIndex] = useState(selectedIndex)

  // Внешнее value изменилось → доводим барабан до нужного пункта (без анимации,
  // чтобы не конфликтовать с пользовательским скроллом).
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const target = selectedIndex * ITEM_HEIGHT
    if (Math.abs(list.scrollTop - target) > 1) {
      isSyncingRef.current = true
      list.scrollTop = target
      // Снимаем флаг после того, как браузер обработает scroll-событие.
      requestAnimationFrame(() => {
        isSyncingRef.current = false
      })
    }
    setActiveIndex(selectedIndex)
  }, [selectedIndex])

  const handleScroll = useCallback(() => {
    const list = listRef.current
    if (!list) return

    // Подсветка центрального пункта в реальном времени.
    const centerIndex = Math.round(list.scrollTop / ITEM_HEIGHT)
    const clamped = Math.min(options.length - 1, Math.max(0, centerIndex))
    setActiveIndex(clamped)

    if (isSyncingRef.current) return

    // Дебаунс «конца скролла»: когда движение остановилось — фиксируем выбор.
    if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current)
    scrollEndTimer.current = setTimeout(() => {
      const next = options[clamped]
      if (next && next.value !== value) {
        onChange(next.value)
      }
    }, 120)
  }, [onChange, options, value])

  useEffect(() => {
    return () => {
      if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current)
    }
  }, [])

  const move = (delta: number) => {
    const next = Math.min(options.length - 1, Math.max(0, selectedIndex + delta))
    if (next !== selectedIndex) {
      onChange(options[next].value)
    }
  }

  // Колесо мыши: нативный скролл со scroll-snap часто проскакивает по 2+ пункта
  // за один «щелчок». Перехватываем wheel и шагаем ровно на один пункт, троттлим,
  // чтобы накопленная инерция не пролистывала барабан рывком. Слушатель вешаем
  // вручную с { passive: false } — React делает onWheel пассивным, и там
  // preventDefault() не работает.
  useEffect(() => {
    const list = listRef.current
    if (!list) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      if (wheelLockRef.current) return
      const direction = event.deltaY > 0 ? 1 : event.deltaY < 0 ? -1 : 0
      if (direction === 0) return
      wheelLockRef.current = true
      move(direction)
      window.setTimeout(() => {
        wheelLockRef.current = false
      }, 140)
    }

    list.addEventListener('wheel', onWheel, { passive: false })
    return () => list.removeEventListener('wheel', onWheel)
  })

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault()
      move(1)
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault()
      move(-1)
    }
  }

  return (
    <div
      className={styles.wheel}
      role="radiogroup"
      aria-label={label}
      aria-activedescendant={`${groupId}-${activeIndex}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.barrel}>
        <div className={styles.viewport} ref={listRef} onScroll={handleScroll}>
          {/* Декоративная «рельса»: проступает только в крайних положениях, где
           * под/над лентой нет пунктов. Скроллится вместе с контентом, поэтому
           * на средних пунктах уезжает из вида. Высота = padding прежних мёртвых
           * зон, так что формула центрирования (index * ITEM_HEIGHT) не меняется. */}
          {railLabel && (
            <div className={styles.rail} aria-hidden="true">
              {railLabel}
            </div>
          )}
          {options.map((option, index) => {
            const distance = Math.abs(index - activeIndex)
            const active = index === activeIndex
            return (
              <button
                key={option.value}
                id={`${groupId}-${index}`}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={-1}
                className={`${styles.item} ${active ? styles.active : ''}`}
                style={{ '--distance': distance } as React.CSSProperties}
                onClick={() => onChange(option.value)}
              >
                {option.label}
              </button>
            )
          })}
          {railLabel && (
            <div className={styles.rail} aria-hidden="true">
              {railLabel}
            </div>
          )}
        </div>
        {/* Маски-градиенты сверху/снизу и рамка центральной ячейки — «окно» барабана. */}
        <div className={styles.selection} aria-hidden="true" />
      </div>
    </div>
  )
}
