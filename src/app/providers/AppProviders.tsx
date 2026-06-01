/**
 * AppProviders — единая точка композиции всех провайдеров приложения.
 *
 * Порядок: тема (визуальный слой) снаружи, состояние лога — внутри.
 * Новые провайдеры (например, мультиплеер) добавляются здесь.
 */

import type { ReactNode } from 'react'
import { ShapeProvider, ColorProvider } from '@shared/theme'
import { LanguageProvider } from '@shared/locale'
import { RollLogProvider } from './RollLogProvider.tsx'
import { SettingsProvider } from './SettingsProvider.tsx'
import { CharacterProvider } from './CharacterProvider.tsx'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <LanguageProvider>
      <ShapeProvider>
        <ColorProvider>
          <SettingsProvider>
            <CharacterProvider>
              <RollLogProvider>{children}</RollLogProvider>
            </CharacterProvider>
          </SettingsProvider>
        </ColorProvider>
      </ShapeProvider>
    </LanguageProvider>
  )
}
