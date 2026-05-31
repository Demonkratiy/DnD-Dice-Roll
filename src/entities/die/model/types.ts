/**
 * Сущность «кубик» (die): тип номинала и его геометрические/числовые свойства.
 */

/** Поддерживаемые номиналы кубиков D&D. */
export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100'

/** Все номиналы в порядке отображения в ленте выбора. */
export const DIE_TYPES: readonly DieType[] = [
  'd4',
  'd6',
  'd8',
  'd10',
  'd12',
  'd20',
  'd100',
] as const

/** Число граней для каждого номинала. */
export const DIE_SIDES: Record<DieType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
}

/** Сколько граней у кубика данного номинала. */
export function getDieSides(die: DieType): number {
  return DIE_SIDES[die]
}
