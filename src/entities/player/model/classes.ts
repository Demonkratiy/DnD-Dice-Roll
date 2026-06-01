/**
 * Реестр классов персонажа D&D (полный набор 5e).
 *
 * Это доменные данные: чистые, сериализуемые, без React. Класс у персонажа
 * опционален — если он не выбран, в шапке остаётся «аморфная» руна.
 *
 * Сами иконки (SVG-силуэты) живут в ui/ClassIcon — здесь только метаданные
 * (id + человекочитаемое имя), нужные для выбора в редакторе героя.
 */

/** Идентификаторы классов (в нижнем регистре, латиницей — стабильные ключи). */
export type PlayerClassId =
  | 'barbarian'
  | 'bard'
  | 'cleric'
  | 'druid'
  | 'fighter'
  | 'monk'
  | 'paladin'
  | 'ranger'
  | 'rogue'
  | 'sorcerer'
  | 'warlock'
  | 'wizard'

/** Метаданные одного класса. */
export interface PlayerClass {
  id: PlayerClassId
  /** Каноничное (англоязычное) название — стабильный дефолт.
   * Локализованные имена для UI живут в словарях `shared/locale`. */
  name: string
}

/** Полный список классов в алфавитном порядке (как в Player's Handbook). */
export const PLAYER_CLASSES: readonly PlayerClass[] = [
  { id: 'barbarian', name: 'Barbarian' },
  { id: 'bard', name: 'Bard' },
  { id: 'cleric', name: 'Cleric' },
  { id: 'druid', name: 'Druid' },
  { id: 'fighter', name: 'Fighter' },
  { id: 'monk', name: 'Monk' },
  { id: 'paladin', name: 'Paladin' },
  { id: 'ranger', name: 'Ranger' },
  { id: 'rogue', name: 'Rogue' },
  { id: 'sorcerer', name: 'Sorcerer' },
  { id: 'warlock', name: 'Warlock' },
  { id: 'wizard', name: 'Wizard' },
] as const

/** Проверяет, что значение — допустимый идентификатор класса. */
export function isPlayerClassId(value: unknown): value is PlayerClassId {
  return typeof value === 'string' && PLAYER_CLASSES.some((cls) => cls.id === value)
}
