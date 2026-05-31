/**
 * ShapeProvider — управляет текущим стилем (ось «форма»: flat/neon).
 *
 * Хранит выбранный стиль в state, применяет его к <html> через data-theme-shapes,
 * сохраняет выбор в localStorage и при первом запуске учитывает системную
 * настройку светлой/тёмной схемы (prefers-color-scheme).
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_SHAPE_ID, isShapeId, type ShapeId } from './shapes.ts'
import { ShapeContext, type ShapeContextValue } from './shapeContext.ts'

const STORAGE_KEY = 'ddr.shape'

/** Определяет стартовый стиль: сохранённый выбор → системная схема → дефолт. */
function resolveInitialShape(): ShapeId {
  if (typeof window === 'undefined') {
    return DEFAULT_SHAPE_ID
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (isShapeId(stored)) {
    return stored
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'neon' : 'flat'
}

interface ShapeProviderProps {
  children: ReactNode
}

export function ShapeProvider({ children }: ShapeProviderProps) {
  const [shapeId, setShapeId] = useState<ShapeId>(resolveInitialShape)

  // Применяем стиль к корню документа и сохраняем выбор.
  useEffect(() => {
    document.documentElement.dataset.themeShapes = shapeId
    window.localStorage.setItem(STORAGE_KEY, shapeId)
  }, [shapeId])

  const setShape = useCallback((id: ShapeId) => {
    setShapeId(id)
  }, [])

  const value = useMemo<ShapeContextValue>(
    () => ({ shapeId, setShape }),
    [shapeId, setShape],
  )

  return <ShapeContext value={value}>{children}</ShapeContext>
}
