/**
 * Reducer лога бросков.
 *
 * Состояние истории описано как применение СОБЫТИЙ к неизменяемому состоянию.
 * Это ключевой задел под мультиплеер: сейчас события рождаются локально
 * (`ROLL_ADDED` после броска), а в будущем тот же редьюсер сможет обрабатывать
 * события, пришедшие по сети, — логика обновления UI не изменится.
 */

import type { RollResult } from './types.ts'

/** Состояние лога: последние броски, самый свежий — первым. */
export interface RollLogState {
  entries: RollResult[]
}

/** События, изменяющие лог. */
export type RollLogEvent =
  | { type: 'ROLL_ADDED'; result: RollResult }
  | { type: 'LOG_CLEARED' }

/** Максимальное число хранимых записей (защита от неограниченного роста). */
export const ROLL_LOG_LIMIT = 100

/** Начальное (пустое) состояние лога. */
export const initialRollLogState: RollLogState = {
  entries: [],
}

/** Чистый редьюсер: (состояние, событие) → новое состояние. */
export function rollLogReducer(
  state: RollLogState,
  event: RollLogEvent,
): RollLogState {
  switch (event.type) {
    case 'ROLL_ADDED':
      return {
        entries: [event.result, ...state.entries].slice(0, ROLL_LOG_LIMIT),
      }
    case 'LOG_CLEARED':
      return initialRollLogState
    default:
      return state
  }
}
