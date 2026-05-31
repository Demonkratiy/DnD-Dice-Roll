/**
 * Реестр цветовых палитр (ось «цвет»).
 *
 * Сами цветовые значения живут в css/palettes.css (блоки `:root[data-theme-colors='...']`).
 * Здесь — только метаданные палитр (id, имя, цвета превью), нужные для отрисовки
 * переключателя в настройках и для типобезопасного списка палитр.
 */

/** Идентификаторы палитр (соответствуют значениям data-theme-colors). */
export type ColorId =
  | 'arcane'
  | 'charm'
  | 'crimson'
  | 'darkness'
  | 'ember'
  | 'frost'
  | 'nature'
  | 'necrotic'
  | 'radiant'
  | 'storm'

/** Метаданные одной палитры. */
export interface ColorMeta {
  id: ColorId
  /** Отображаемое название. */
  name: string
  /** Краткие цвета для миниатюры-превью в настройках. */
  preview: {
    accent: string
    secondary: string
  }
}

/** Палитра по умолчанию (если у пользователя нет сохранённого выбора). */
export const DEFAULT_COLOR_ID: ColorId = 'ember'

/** Список палитр в порядке отображения (по алфавиту). */
export const COLORS: readonly ColorMeta[] = [
  {
    id: 'arcane',
    name: 'Arcane',
    preview: { accent: '#a855f7', secondary: '#38bdf8' },
  },
  {
    id: 'charm',
    name: 'Charm',
    preview: { accent: '#ec4899', secondary: '#fb7185' },
  },
  {
    id: 'crimson',
    name: 'Crimson',
    preview: { accent: '#dc2626', secondary: '#f87171' },
  },
  {
    id: 'darkness',
    name: 'Darkness',
    preview: { accent: '#1c1f26', secondary: '#e6f1ff' },
  },
  {
    id: 'ember',
    name: 'Ember',
    preview: { accent: '#f97316', secondary: '#f43f5e' },
  },
  {
    id: 'frost',
    name: 'Frost',
    preview: { accent: '#38bdf8', secondary: '#a5f3fc' },
  },
  {
    id: 'nature',
    name: 'Nature',
    preview: { accent: '#22c55e', secondary: '#eab308' },
  },
  {
    id: 'necrotic',
    name: 'Necrotic',
    preview: { accent: '#5e8d72', secondary: '#7e22ce' },
  },
  {
    id: 'radiant',
    name: 'Radiant',
    preview: { accent: '#ffe27a', secondary: '#fffbe6' },
  },
  {
    id: 'storm',
    name: 'Storm',
    preview: { accent: '#facc15', secondary: '#bae6fd' },
  },
] as const

/** Проверяет, что строка — допустимый идентификатор палитры. */
export function isColorId(value: unknown): value is ColorId {
  return typeof value === 'string' && COLORS.some((color) => color.id === value)
}
