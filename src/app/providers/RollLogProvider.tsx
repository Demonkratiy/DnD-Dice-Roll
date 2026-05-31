/**
 * RollLogProvider — провайдер состояния лога бросков.
 *
 * Внутри использует чистый `rollLogReducer` (entities/roll): состояние меняется
 * только через события (ROLL_ADDED / LOG_CLEARED). Этот же редьюсер в будущем
 * обработает события, пришедшие по сети.
 */

import { useCallback, useMemo, useReducer, type ReactNode } from 'react'
import {
  rollLogReducer,
  initialRollLogState,
  type RollResult,
} from '@entities/roll'
import { RollLogContext, type RollLogContextValue } from './rollLogContext.ts'

interface RollLogProviderProps {
  children: ReactNode
}

export function RollLogProvider({ children }: RollLogProviderProps) {
  const [state, dispatch] = useReducer(rollLogReducer, initialRollLogState)

  const addRoll = useCallback((result: RollResult) => {
    dispatch({ type: 'ROLL_ADDED', result })
  }, [])

  const clearLog = useCallback(() => {
    dispatch({ type: 'LOG_CLEARED' })
  }, [])

  const value = useMemo<RollLogContextValue>(
    () => ({ entries: state.entries, addRoll, clearLog }),
    [state.entries, addRoll, clearLog],
  )

  return <RollLogContext value={value}>{children}</RollLogContext>
}
