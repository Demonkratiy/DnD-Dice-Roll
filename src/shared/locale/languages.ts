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

/**
 * Язык по умолчанию (если у пользователя нет сохранённого выбора).
 *
 * Английский — чтобы приложение было «международным из коробки»; остальные языки
 * остаются полноценно поддержанными и переключаются в настройках.
 */
export const DEFAULT_LANGUAGE_ID: LanguageId = 'en'

/** Список языков в порядке отображения (английский первым как основной). */
export const LANGUAGES: readonly LanguageMeta[] = [
  { id: 'en', name: 'English' },
  { id: 'ru', name: 'Русский' },
  { id: 'sr', name: 'Srpski' },
  { id: 'tt', name: 'Татарча' },
] as const

/** Проверяет, что значение — допустимый идентификатор языка. */
export function isLanguageId(value: unknown): value is LanguageId {
  return typeof value === 'string' && LANGUAGES.some((lang) => lang.id === value)
}

/**
 * Сопоставляет BCP-47-тег (например, `ru-RU`, `en`, `sr-Latn`) с поддерживаемым
 * языком, сравнивая только первичный субтег (часть до дефиса). Возвращает `null`,
 * если совпадения нет — вызывающий код сам решает, что использовать как фоллбэк.
 */
export function matchLanguage(tag: string | null | undefined): LanguageId | null {
  if (!tag) {
    return null
  }

  const primary = tag.toLowerCase().split('-')[0]
  return LANGUAGES.find((lang) => lang.id === primary)?.id ?? null
}

/**
 * Подбирает язык по списку предпочтений пользователя (`navigator.languages`):
 * берёт первый тег, для которого есть поддерживаемый язык. Если ни один не
 * подошёл — возвращает дефолтный (английский).
 */
export function detectPreferredLanguage(
  preferred: readonly string[] | undefined,
): LanguageId {
  for (const tag of preferred ?? []) {
    const match = matchLanguage(tag)
    if (match) {
      return match
    }
  }

  return DEFAULT_LANGUAGE_ID
}
