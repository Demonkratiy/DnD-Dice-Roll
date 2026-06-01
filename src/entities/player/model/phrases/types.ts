/**
 * Типы доменных реплик персонажа («эмоции» броска).
 *
 * Чистые сериализуемые данные, без React. Конкретные тексты разнесены по языкам
 * в `ru.ts` / `en.ts`, а единая точка доступа — `getClassPhrases` в `index.ts`.
 */

import type { PlayerClassId } from '../classes.ts'

/** Наборы реплик для одного класса по моментам броска. */
export interface ClassPhrases {
  /** Фразы в момент тряски (зажатие). */
  shake: readonly string[]
  /** Фразы в момент броска (отпускание, крутятся кубики). */
  release: readonly string[]
  /** Фразы на критический успех d20 (выпала 20). */
  success: readonly string[]
  /** Фразы на критический провал d20 (выпала 1). */
  fail: readonly string[]
}

/** Полный набор реплик по всем классам (для одного языка). */
export type PhrasesByClass = Record<PlayerClassId, ClassPhrases>
