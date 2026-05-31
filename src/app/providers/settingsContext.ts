/**
 * Настройки приложения (UI-предпочтения), сохраняемые в localStorage.
 * Тема живёт отдельно в ThemeProvider; здесь — показ логов и отключение анимаций.
 */

import { createContext, useContext } from 'react'

export interface Settings {
  /** Показывать ли хэндл-перо и панель логов. */
  showLogs: boolean
  /** Принудительно отключить анимации (помимо системного prefers-reduced-motion). */
  disableAnimations: boolean
}

export interface SettingsContextValue extends Settings {
  setShowLogs: (value: boolean) => void
  setDisableAnimations: (value: boolean) => void
}

export const DEFAULT_SETTINGS: Settings = {
  showLogs: true,
  disableAnimations: false,
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext)
  if (!value) {
    throw new Error('useSettings должен использоваться внутри SettingsProvider')
  }
  return value
}
