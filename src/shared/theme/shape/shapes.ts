/**
 * Реестр стилей (ось «форма»: flat/neon).
 *
 * Сами визуальные значения живут в tokens.css (CSS-переменные). Здесь — только
 * метаданные стилей (id, человекочитаемое имя, цвета для превью), нужные для
 * отрисовки переключателя в настройках и для типобезопасного списка стилей.
 */

/** Идентификаторы доступных стилей (соответствуют значениям data-theme-shapes). */
export type ShapeId = 'flat' | 'neon'

/** Метаданные одного стиля. */
export interface ShapeMeta {
  id: ShapeId
  /** Отображаемое название. */
  name: string
  /** Краткие цвета для миниатюры-превью в настройках. */
  preview: {
    bg: string
    accent: string
    die: string
  }
  /** Базовая светлота — подсказка для UI (например, иконка солнца/луны). */
  scheme: 'light' | 'dark'
}

/** Стиль по умолчанию (если у пользователя нет сохранённого выбора). */
export const DEFAULT_SHAPE_ID: ShapeId = 'flat'

/** Список стилей в порядке отображения. */
export const SHAPES: readonly ShapeMeta[] = [
  {
    id: 'flat',
    name: 'Flat',
    preview: { bg: '#f4f5f7', accent: '#4f46e5', die: '#1c1f26' },
    scheme: 'light',
  },
  {
    id: 'neon',
    name: 'Neon',
    preview: { bg: '#0b0f1a', accent: '#22d3ee', die: '#22d3ee' },
    scheme: 'dark',
  },
] as const

/** Проверяет, что строка — допустимый идентификатор стиля. */
export function isShapeId(value: unknown): value is ShapeId {
  return typeof value === 'string' && SHAPES.some((shape) => shape.id === value)
}
