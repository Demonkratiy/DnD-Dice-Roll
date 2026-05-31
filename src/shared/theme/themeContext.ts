/**
 * Контекст темы и хук доступа. Вынесено в не-компонентный файл (react-refresh).
 */

import { createContext, useContext } from 'react'
import type { ThemeId } from './themes.ts'

export interface ThemeContextValue {
  /** Текущая тема. */
  themeId: ThemeId
  /** Сменить тему. */
  setTheme: (id: ThemeId) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

/** Доступ к теме. Бросает ошибку вне провайдера. */
export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (!value) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return value
}
