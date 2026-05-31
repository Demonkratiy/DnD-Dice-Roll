/**
 * ColorProvider — управляет текущей цветовой палитрой (ось «цвет»).
 *
 * Хранит выбранную палитру в state, применяет её к <html> через data-theme-colors
 * и сохраняет выбор в localStorage. Ось «цвет» независима от оси «форма»
 * (ShapeProvider), поэтому любой стиль свободно сочетается с любой палитрой.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_COLOR_ID, isColorId, type ColorId } from './colors.ts'
import { ColorContext, type ColorContextValue } from './colorContext.ts'

const STORAGE_KEY = 'ddr.color'

/** Определяет стартовую палитру: сохранённый выбор → дефолт. */
function resolveInitialColor(): ColorId {
  if (typeof window === 'undefined') {
    return DEFAULT_COLOR_ID
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  return isColorId(stored) ? stored : DEFAULT_COLOR_ID
}

interface ColorProviderProps {
  children: ReactNode
}

export function ColorProvider({ children }: ColorProviderProps) {
  const [colorId, setColorId] = useState<ColorId>(resolveInitialColor)

  // Применяем палитру к корню документа и сохраняем выбор.
  useEffect(() => {
    document.documentElement.dataset.themeColors = colorId
    window.localStorage.setItem(STORAGE_KEY, colorId)
  }, [colorId])

  const setColor = useCallback((id: ColorId) => {
    setColorId(id)
  }, [])

  const value = useMemo<ColorContextValue>(
    () => ({ colorId, setColor }),
    [colorId, setColor],
  )

  return <ColorContext value={value}>{children}</ColorContext>
}
