/**
 * AppProviders — единая точка композиции всех провайдеров приложения.
 *
 * Порядок: тема (визуальный слой) снаружи, состояние лога — внутри.
 * Новые провайдеры (например, мультиплеер) добавляются здесь.
 */

import type { ReactNode } from 'react'
import { ThemeProvider } from '@shared/theme'
import { RollLogProvider } from './RollLogProvider.tsx'
import { SettingsProvider } from './SettingsProvider.tsx'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <RollLogProvider>{children}</RollLogProvider>
      </SettingsProvider>
    </ThemeProvider>
  )
}
