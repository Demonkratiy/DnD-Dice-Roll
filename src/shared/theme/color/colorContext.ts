/**
 * Контекст палитры (ось «цвет») и хук доступа.
 * Вынесено в не-компонентный файл (react-refresh).
 */

import { createContext, useContext } from 'react'
import type { ColorId } from './colors.ts'

export interface ColorContextValue {
  /** Текущая палитра. */
  colorId: ColorId
  /** Сменить палитру. */
  setColor: (id: ColorId) => void
}

export const ColorContext = createContext<ColorContextValue | null>(null)

/** Доступ к палитре. Бросает ошибку вне провайдера. */
export function useColor(): ColorContextValue {
  const value = useContext(ColorContext)
  if (!value) {
    throw new Error('useColor must be used within a ColorProvider')
  }
  return value
}
