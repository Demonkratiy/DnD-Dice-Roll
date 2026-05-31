/**
 * App — корневой компонент: оборачивает экран в провайдеры (тема, настройки, лог).
 */
import { AppProviders } from './providers'
import { RollScreen } from './ui/RollScreen.tsx'

export function App() {
  return (
    <AppProviders>
      <RollScreen />
    </AppProviders>
  )
}
