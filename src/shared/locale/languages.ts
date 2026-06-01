/**
 * Реестр языков интерфейса (ось «язык»).
 *
 * По духу повторяет реестры тем (`shape`) и палитр (`color`): здесь только
 * стабильные идентификаторы и человекочитаемые названия. Сами строки перевода
 * живут в `dictionaries/`, а доменные реплики — в `entities/player`.
 */

/** Идентификаторы поддерживаемых языков (стабильные ключи, как BCP-47-коды). */
export type LanguageId = 'ru' | 'en' | 'sr' | 'tt'

/** Метаданные одного языка для переключателя в настройках. */
export interface LanguageMeta {
  id: LanguageId
  /** Название языка на нём самом (endonym). */
  name: string
}

/** Язык по умолчанию (если у пользователя нет сохранённого выбора). */
export const DEFAULT_LANGUAGE_ID: LanguageId = 'ru'

/** Список языков в порядке отображения. */
export const LANGUAGES: readonly LanguageMeta[] = [
  { id: 'ru', name: 'Русский' },
  { id: 'en', name: 'English' },
  { id: 'sr', name: 'Srpski' },
  { id: 'tt', name: 'Татарча' },
] as const

/** Проверяет, что значение — допустимый идентификатор языка. */
export function isLanguageId(value: unknown): value is LanguageId {
  return typeof value === 'string' && LANGUAGES.some((lang) => lang.id === value)
}
