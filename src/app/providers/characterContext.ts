/**
 * Персонаж (герой) локального игрока — редактируемые данные: имя и (опц.) класс.
 *
 * Это доменное состояние игрока, а не UI-настройка приложения, поэтому оно живёт
 * в отдельном провайдере (CharacterProvider), а не в Settings. Структура совпадает
 * с редактируемой частью Player и готова к будущему мультиплееру (у каждого игрока
 * в комнате свой герой).
 */

import { createContext, useContext } from 'react'
import type { PlayerClassId } from '@entities/player'

export interface Character {
  /** Имя персонажа. */
  name: string
  /** Выбранный класс (необязателен). */
  classId?: PlayerClassId
}

export interface CharacterContextValue extends Character {
  setName: (name: string) => void
  setClassId: (classId: PlayerClassId | undefined) => void
}

export const DEFAULT_CHARACTER: Character = {
  name: 'Avatar Name',
  classId: undefined,
}

export const CharacterContext = createContext<CharacterContextValue | null>(null)

export function useCharacter(): CharacterContextValue {
  const value = useContext(CharacterContext)
  if (!value) {
    throw new Error('useCharacter должен использоваться внутри CharacterProvider')
  }
  return value
}
