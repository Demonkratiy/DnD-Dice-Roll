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

  // Neon — дефолтная «витрина»: показываем её всем, кроме тех, у кого система
  // явно просит светлую схему (им вежливее отдать flat). При отсутствии
  // предпочтения новый пользователь видит именно Neon.
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
  return prefersLight ? 'flat' : DEFAULT_SHAPE_ID
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
