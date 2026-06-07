/**
 * SettingsProvider — хранит UI-настройки и синхронизирует их с localStorage.
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  DEFAULT_SETTINGS,
  SettingsContext,
  type Settings,
} from './settingsContext.ts'

const STORAGE_KEY = 'ddr.settings'

function readInitialSettings(): Settings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_SETTINGS
    }
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      showLogs: parsed.showLogs ?? DEFAULT_SETTINGS.showLogs,
      disableAnimations: parsed.disableAnimations ?? DEFAULT_SETTINGS.disableAnimations,
      soundEnabled: parsed.soundEnabled ?? DEFAULT_SETTINGS.soundEnabled,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(readInitialSettings)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Запись в хранилище не критична — игнорируем ошибки (например, приватный режим).
    }
  }, [settings])

  const setShowLogs = useCallback(
    (showLogs: boolean) => setSettings((prev) => ({ ...prev, showLogs })),
    [],
  )
  const setDisableAnimations = useCallback(
    (disableAnimations: boolean) => setSettings((prev) => ({ ...prev, disableAnimations })),
    [],
  )
  const setSoundEnabled = useCallback(
    (soundEnabled: boolean) => setSettings((prev) => ({ ...prev, soundEnabled })),
    [],
  )

  return (
    <SettingsContext value={{ ...settings, setShowLogs, setDisableAnimations, setSoundEnabled }}>
      {children}
    </SettingsContext>
  )
}
