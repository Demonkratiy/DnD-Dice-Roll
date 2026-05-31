/**
 * Контекст лога бросков и хук доступа к нему.
 *
 * Вынесено в отдельный (не компонентный) файл, чтобы провайдер-компонент
 * экспортировался изолированно — это требование правила react-refresh.
 */

import { createContext, useContext } from 'react'
import type { RollResult } from '@entities/roll'

/** Значение контекста: данные лога и действия над ним. */
export interface RollLogContextValue {
  /** Записи лога, самая свежая — первой. */
  entries: RollResult[]
  /** Добавить результат броска в лог. */
  addRoll: (result: RollResult) => void
  /** Очистить лог. */
  clearLog: () => void
}

export const RollLogContext = createContext<RollLogContextValue | null>(null)

/** Доступ к логу бросков. Бросает ошибку, если использован вне провайдера. */
export function useRollLog(): RollLogContextValue {
  const value = useContext(RollLogContext)
  if (!value) {
    throw new Error('useRollLog must be used within a RollLogProvider')
  }
  return value
}
