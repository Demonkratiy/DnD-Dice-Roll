/**
 * ThemeProvider — управляет текущей темой.
 *
 * Хранит выбранную тему в state, применяет её к <html> через data-theme,
 * сохраняет выбор в localStorage и при первом запуске учитывает системную
 * настройку светлой/тёмной схемы (prefers-color-scheme).
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_THEME_ID, isThemeId, type ThemeId } from './themes.ts'
import { ThemeContext, type ThemeContextValue } from './themeContext.ts'

const STORAGE_KEY = 'ddr.theme'

/** Определяет стартовую тему: сохранённый выбор → системная схема → дефолт. */
function resolveInitialTheme(): ThemeId {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME_ID
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (isThemeId(stored)) {
    return stored
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'neon' : 'flat'
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeId, setThemeId] = useState<ThemeId>(resolveInitialTheme)

  // Применяем тему к корню документа и сохраняем выбор.
  useEffect(() => {
    document.documentElement.dataset.theme = themeId
    window.localStorage.setItem(STORAGE_KEY, themeId)
  }, [themeId])

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ themeId, setTheme }),
    [themeId, setTheme],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
