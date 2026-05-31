/**
 * Реестр тем оформления.
 *
 * Сами визуальные значения живут в tokens.css (CSS-переменные). Здесь — только
 * метаданные тем (id, человекочитаемое имя, цвета для превью), нужные для
 * отрисовки переключателя в настройках и для типобезопасного списка тем.
 */

/** Идентификаторы доступных тем (соответствуют значениям data-theme). */
export type ThemeId = 'flat' | 'neon'

/** Метаданные одной темы. */
export interface ThemeMeta {
  id: ThemeId
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

/** Тема по умолчанию (если у пользователя нет сохранённого выбора). */
export const DEFAULT_THEME_ID: ThemeId = 'flat'

/** Список тем в порядке отображения. */
export const THEMES: readonly ThemeMeta[] = [
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

/** Проверяет, что строка — допустимый идентификатор темы. */
export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEMES.some((theme) => theme.id === value)
}
