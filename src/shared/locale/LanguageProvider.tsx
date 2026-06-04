/**
 * LanguageProvider — управляет текущим языком интерфейса (ось «язык»).
 *
 * Хранит выбранный язык в state, проставляет его в `<html lang="...">` (важно для
 * доступности и поисковиков) и сохраняет выбор в localStorage. По устройству это
 * близнец ColorProvider — единый паттерн для всех «осей оформления».
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_LANGUAGE_ID,
  detectPreferredLanguage,
  isLanguageId,
  type LanguageId,
} from './languages.ts'
import { LanguageContext, type LanguageContextValue } from './languageContext.ts'

const STORAGE_KEY = 'ddr.lang'

/** Определяет стартовый язык: сохранённый выбор → язык браузера/системы → дефолт. */
function resolveInitialLanguage(): LanguageId {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE_ID
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (isLanguageId(stored)) {
    return stored
  }

  // Нет сохранённого выбора — пробуем угадать по предпочтениям пользователя
  // (`navigator.languages`, упорядочены по приоритету). Если ни один язык не
  // поддерживается — внутри вернётся дефолтный английский.
  return detectPreferredLanguage(window.navigator.languages)
}

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [lang, setLang] = useState<LanguageId>(resolveInitialLanguage)

  // Применяем язык к корню документа и сохраняем выбор.
  useEffect(() => {
    document.documentElement.lang = lang
    window.localStorage.setItem(STORAGE_KEY, lang)
  }, [lang])

  const setLanguage = useCallback((id: LanguageId) => {
    setLang(id)
  }, [])

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLanguage }),
    [lang, setLanguage],
  )

  return <LanguageContext value={value}>{children}</LanguageContext>
}
