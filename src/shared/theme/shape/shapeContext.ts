/**
 * Контекст стиля (ось «форма») и хук доступа.
 * Вынесено в не-компонентный файл (react-refresh).
 */

import { createContext, useContext } from 'react'
import type { ShapeId } from './shapes.ts'

export interface ShapeContextValue {
  /** Текущий стиль. */
  shapeId: ShapeId
  /** Сменить стиль. */
  setShape: (id: ShapeId) => void
}

export const ShapeContext = createContext<ShapeContextValue | null>(null)

/** Доступ к стилю. Бросает ошибку вне провайдера. */
export function useShape(): ShapeContextValue {
  const value = useContext(ShapeContext)
  if (!value) {
    throw new Error('useShape must be used within a ShapeProvider')
  }
  return value
}
