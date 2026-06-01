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
  /** Отображаемое название. */
  name: string
}

/** Полный список классов в алфавитном порядке (как в Player's Handbook). */
export const PLAYER_CLASSES: readonly PlayerClass[] = [
  { id: 'barbarian', name: 'Варвар' },
  { id: 'bard', name: 'Бард' },
  { id: 'cleric', name: 'Жрец' },
  { id: 'druid', name: 'Друид' },
  { id: 'fighter', name: 'Воин' },
  { id: 'monk', name: 'Монах' },
  { id: 'paladin', name: 'Паладин' },
  { id: 'ranger', name: 'Следопыт' },
  { id: 'rogue', name: 'Плут' },
  { id: 'sorcerer', name: 'Чародей' },
  { id: 'warlock', name: 'Колдун' },
  { id: 'wizard', name: 'Волшебник' },
] as const

/** Проверяет, что значение — допустимый идентификатор класса. */
export function isPlayerClassId(value: unknown): value is PlayerClassId {
  return typeof value === 'string' && PLAYER_CLASSES.some((cls) => cls.id === value)
}
