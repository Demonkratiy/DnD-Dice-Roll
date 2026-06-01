/**
 * Public API слайса локализации (`shared/locale`).
 *
 * Снаружи импортируем только отсюда: переключение языка (`LanguageProvider`,
 * `useLanguage`), переводчик UI-строк (`useT`) и реестр языков для настроек.
 */

export {
  LANGUAGES,
  DEFAULT_LANGUAGE_ID,
  isLanguageId,
  type LanguageId,
  type LanguageMeta,
} from './languages.ts'
export { LanguageProvider } from './LanguageProvider.tsx'
export { useLanguage, type LanguageContextValue } from './languageContext.ts'
export { useT } from './useTranslation.ts'
export type { Dictionary } from './dictionaries/dictionary.ts'
