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
 * Взаимодействие зависит от устройства (`pointerType`):
 *  - мышь — раскрытие наведением (hover), выбор кликом считается геометрически;
 *  - тач/перо — hover игнорируем (он «залипает» и приходит вместе с касанием).
 *    Раскрытие/выбор — по тапу (на отпускании), а свайп распознаём как скролл по
 *    сдвигу пальца и НЕ выбираем пункт, отдавая жест нативному scroll-snap.
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

/** Сдвиг пальца (px), сверх которого жест считается скроллом, а не тапом. */
const TAP_MOVE_THRESHOLD = 8

export function WheelPicker<T extends string>({
  label,
  options,
  value,
  onChange,
  railLabel,
}: WheelPickerProps<T>) {
  const groupId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Чтобы программный скролл (синхронизация по value) не порождал «эхо» onChange.
  const isSyncingRef = useRef(false)
  // Троттл-замок для прокрутки колесом мыши: один шаг за «щелчок».
  const wheelLockRef = useRef(false)
  // Зеркало isOpen для синхронного чтения внутри обработчиков (без устаревания).
  const openRef = useRef(false)
  // Флаг «фокус пришёл от клика мышью»: чтобы не раскрывать барабан по фокусу при
  // клике (иначе клик-по-выбору тут же снова бы открыл). Клавиатурный фокус —
  // раскрывает; мышиный — нет.
  const pointerDownRef = useRef(false)
  // Выбор мышью делается в onPointerDown; этот флаг гасит парный onClick, чтобы
  // не обработать тот же выбор дважды.
  const mouseHandledRef = useRef(false)
  // Тач/перо: различаем «тап» (раскрыть/выбрать) и «свайп» (скролл). Запоминаем
  // стартовый Y касания и факт, что палец ушёл дальше порога. Если это свайп —
  // парный click по пункту глушим (touchHandledRef), иначе он принудительно
  // выберет пункт под пальцем поверх того, к чему прилип scroll-snap (баг
  // «пролистывает сразу 2»).
  const touchStartYRef = useRef(0)
  const touchMovedRef = useRef(false)
  const touchHandledRef = useRef(false)

  // Раскрыт ли барабан. В покое схлопнут до одного пункта; раскрывается при
  // наведении, клавиатурном фокусе и клике по свёрнутому барабану. Сворачивается
  // при уводе курсора, потере фокуса и клике по выбранному пункту.
  const [isOpen, setIsOpen] = useState(false)
  const setOpen = useCallback((next: boolean) => {
    openRef.current = next
    setIsOpen(next)
  }, [])

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

  // При раскрытии/сворачивании барабана пере-доводим scrollTop до выбранного
  // пункта. Подстраховка от любого остаточного сдвига при reflow (рост «рельс»),
  // чтобы scrollTop и activeIndex не разъехались и выбор кликом был точным.
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const target = selectedIndex * ITEM_HEIGHT
    if (Math.abs(list.scrollTop - target) > 1) {
      isSyncingRef.current = true
      list.scrollTop = target
      requestAnimationFrame(() => {
        isSyncingRef.current = false
      })
    }
    setActiveIndex(selectedIndex)
  }, [isOpen, selectedIndex])

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
      setOpen(true)
      move(1)
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault()
      setOpen(true)
      move(-1)
    }
  }

  // Выбор пункта по индексу: доводим барабан до него (гасим эхо-скролл, чтобы
  // дебаунс handleScroll не «перебил» выбор центральным пунктом), затем
  // сворачиваем и снимаем фокус.
  const selectIndex = (index: number) => {
    const clamped = Math.min(options.length - 1, Math.max(0, index))
    if (scrollEndTimer.current) {
      clearTimeout(scrollEndTimer.current)
      scrollEndTimer.current = null
    }
    const list = listRef.current
    if (list) {
      isSyncingRef.current = true
      list.scrollTop = clamped * ITEM_HEIGHT
      requestAnimationFrame(() => {
        isSyncingRef.current = false
      })
    }
    setActiveIndex(clamped)
    onChange(options[clamped].value)
    setOpen(false)
    wheelRef.current?.blur()
    pointerDownRef.current = false
  }

  // Клик мышью по барабану. Целевой пункт вычисляем геометрически — по смещению
  // курсора от центра барабана, а НЕ по тому, какой DOM-элемент принял указатель:
  // из-за scale() дальних пунктов и scroll-snap их хитбоксы смещаются (зазоры и
  // перекрытия), из-за чего клик попадал в соседний пункт. Геометрия совпадает с
  // тем, что видит пользователь. Свёрнутый барабан клик лишь раскрывает.
  const handleBarrelMouseDown = (event: React.PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    event.preventDefault()
    mouseHandledRef.current = true
    if (!openRef.current) {
      setOpen(true)
      return
    }
    const list = listRef.current
    if (!list) return
    const rect = list.getBoundingClientRect()
    const centerY = rect.top + rect.height / 2
    const offsetItems = Math.round((event.clientY - centerY) / ITEM_HEIGHT)
    // Центральный пункт берём из живого scrollTop (он source of truth и ставится
    // синхронно в selectIndex), а НЕ из React-стейта activeIndex: при быстрых
    // повторных кликах activeIndex в замыкании рендера может отставать.
    const centerIndex = Math.round(list.scrollTop / ITEM_HEIGHT)
    selectIndex(centerIndex + offsetItems)
  }

  // Указатель опущен на барабан. Мышь идёт прежним геометрическим путём; для
  // тача/пера лишь фиксируем старт жеста — раскрытие/выбор решаем на отпускании,
  // когда уже известно, был это тап или свайп.
  const handleViewportPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType === 'mouse') {
      handleBarrelMouseDown(event)
      return
    }
    touchStartYRef.current = event.clientY
    touchMovedRef.current = false
    touchHandledRef.current = false
  }

  // Палец поехал — за порогом считаем жест скроллом (а не тапом).
  const handleViewportPointerMove = (event: React.PointerEvent) => {
    if (event.pointerType === 'mouse') return
    if (Math.abs(event.clientY - touchStartYRef.current) > TAP_MOVE_THRESHOLD) {
      touchMovedRef.current = true
    }
  }

  // Палец отпущен. Свайп → это скролл: выбор сделают нативный snap и дебаунс
  // handleScroll, поэтому НИЧЕГО не выбираем (браузер после скролла click не шлёт).
  // Тап → свёрнутый барабан раскрываем; раскрытый — выбираем пункт геометрически
  // (та же формула, что для мыши). touchHandledRef гасит парный click по пункту.
  const handleViewportPointerUp = (event: React.PointerEvent) => {
    if (event.pointerType === 'mouse') return
    if (touchMovedRef.current) return
    touchHandledRef.current = true
    if (!openRef.current) {
      setOpen(true)
      return
    }
    const list = listRef.current
    if (!list) return
    const rect = list.getBoundingClientRect()
    const centerY = rect.top + rect.height / 2
    const offsetItems = Math.round((event.clientY - centerY) / ITEM_HEIGHT)
    const centerIndex = Math.round(list.scrollTop / ITEM_HEIGHT)
    selectIndex(centerIndex + offsetItems)
  }

  return (
    <div
      className={`${styles.wheel} ${isOpen ? styles.open : ''}`}
      ref={wheelRef}
      role="radiogroup"
      aria-label={label}
      aria-activedescendant={`${groupId}-${activeIndex}`}
      // Реальное состояние «барабан раскрыт» наружу, чтобы соседние элементы
      // (например подпись «Режим») могли реагировать на него через CSS :has() —
      // НЕ через :hover/:focus, который залипает на тач-устройствах (sticky hover).
      data-open={isOpen ? 'true' : 'false'}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerEnter={(event) => {
        // Раскрытие наведением — только для мыши. На тач-устройствах «hover»
        // приходит вместе с касанием, а pointerleave — сразу после отрыва пальца,
        // из-за чего барабан открывался и тут же закрывался: первый тап «не
        // срабатывал». Тачем барабан раскрывается тапом (см. handleViewportPointerUp).
        if (event.pointerType === 'mouse') setOpen(true)
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'mouse') return
        pointerDownRef.current = false
        setOpen(false)
      }}
      onPointerDown={() => {
        pointerDownRef.current = true
      }}
      onFocus={() => {
        // Раскрываем по фокусу только для клавиатуры; при клике мышью фокус
        // игнорируем (раскрытием/сворачиванием управляет handleItemClick).
        if (!pointerDownRef.current) setOpen(true)
      }}
      onBlur={() => setOpen(false)}
    >
      <div className={styles.barrel}>
        <div
          className={styles.viewport}
          ref={listRef}
          onScroll={handleScroll}
          onPointerDown={handleViewportPointerDown}
          onPointerMove={handleViewportPointerMove}
          onPointerUp={handleViewportPointerUp}
        >
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
                onClick={() => {
                  // И мышь (геометрия в onPointerDown), и тач/перо (тап в
                  // onPointerUp) уже обработали выбор — парный click глушим, чтобы
                  // не выбрать дважды. Остаётся клавиатура/доступность.
                  if (touchHandledRef.current) {
                    touchHandledRef.current = false
                    return
                  }
                  if (mouseHandledRef.current) {
                    mouseHandledRef.current = false
                    return
                  }
                  if (!openRef.current) {
                    setOpen(true)
                    return
                  }
                  selectIndex(index)
                }}
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
