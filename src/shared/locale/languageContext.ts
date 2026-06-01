/**
 * Контекст текущего языка интерфейса и хук доступа.
 * Вынесено в не-компонентный файл (react-refresh), как и у темы/палитры.
 */

import { createContext, useContext } from 'react'
import type { LanguageId } from './languages.ts'

export interface LanguageContextValue {
  /** Текущий язык. */
  lang: LanguageId
  /** Сменить язык. */
  setLanguage: (id: LanguageId) => void
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

/** Доступ к текущему языку. Бросает ошибку вне провайдера. */
export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext)
  if (!value) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return value
}
