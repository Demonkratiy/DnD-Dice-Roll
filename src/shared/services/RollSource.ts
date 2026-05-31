/**
 * RollSource — источник бросков за абстракцией.
 *
 * Это главный «шов» под будущий мультиплеер. UI и состояние работают с интерфейсом
 * `RollSource`, не зная, считается ли бросок локально или приходит с сервера.
 *  - Сейчас:  `LocalRollSource` — честный локальный бросок (rollDice + RNG).
 *  - Позже:   `RemoteRollSource` (WebSocket) — тот же интерфейс, другой источник.
 *
 * Метод асинхронный намеренно: локальная реализация резолвится сразу, но сигнатура
 * уже готова к сетевой задержке, и UI не придётся переписывать.
 */

import { rollDice, type RollRequest, type RollResult } from '@entities/roll'
import type { Player } from '@entities/player'
import { createMathRandomRng, type Rng } from '@shared/lib'

/** Абстрактный источник бросков. */
export interface RollSource {
  /** Выполнить бросок по запросу и вернуть итоговое событие. */
  roll(request: RollRequest): Promise<RollResult>
}

/** Зависимости локального источника (всё инъектируется ради тестируемости). */
export interface LocalRollSourceDeps {
  /** Источник случайности. По умолчанию — на основе Math.random. */
  rng?: Rng
  /** Кто автор броска (на будущее — текущий игрок). */
  getAuthor: () => Player
  /** Генератор идентификаторов события. По умолчанию — crypto.randomUUID. */
  createId?: () => string
  /** Источник времени. По умолчанию — Date.now. */
  now?: () => number
}

/** Создаёт уникальный id с запасным вариантом, если crypto недоступен. */
function defaultCreateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `roll_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

/**
 * Локальный источник бросков: считает исход через чистую `rollDice` и дополняет
 * его метаданными события (id, время, автор).
 */
export function createLocalRollSource(deps: LocalRollSourceDeps): RollSource {
  const rng = deps.rng ?? createMathRandomRng()
  const createId = deps.createId ?? defaultCreateId
  const now = deps.now ?? Date.now

  return {
    roll(request: RollRequest): Promise<RollResult> {
      const outcome = rollDice(request, rng)
      const result: RollResult = {
        ...outcome,
        id: createId(),
        request,
        author: deps.getAuthor(),
        timestamp: now(),
      }
      return Promise.resolve(result)
    },
  }
}
