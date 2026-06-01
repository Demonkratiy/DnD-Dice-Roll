/**
 * CharacterProvider — хранит данные героя (имя, класс) и синхронизирует их с
 * localStorage. Структура по образцу SettingsProvider.
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { isPlayerClassId, type PlayerClassId } from '@entities/player'
import {
  DEFAULT_CHARACTER,
  CharacterContext,
  type Character,
} from './characterContext.ts'

const STORAGE_KEY = 'ddr.character'

function readInitialCharacter(): Character {
  if (typeof window === 'undefined') {
    return DEFAULT_CHARACTER
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_CHARACTER
    }
    const parsed = JSON.parse(raw) as Partial<Character>
    return {
      name:
        typeof parsed.name === 'string' && parsed.name.trim()
          ? parsed.name
          : DEFAULT_CHARACTER.name,
      classId: isPlayerClassId(parsed.classId) ? parsed.classId : undefined,
    }
  } catch {
    return DEFAULT_CHARACTER
  }
}

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [character, setCharacter] = useState<Character>(readInitialCharacter)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(character))
    } catch {
      // Запись в хранилище не критична — игнорируем ошибки (например, приватный режим).
    }
  }, [character])

  const setName = useCallback(
    (name: string) => setCharacter((prev) => ({ ...prev, name })),
    [],
  )
  const setClassId = useCallback(
    (classId: PlayerClassId | undefined) => setCharacter((prev) => ({ ...prev, classId })),
    [],
  )

  return (
    <CharacterContext value={{ ...character, setName, setClassId }}>
      {children}
    </CharacterContext>
  )
}
