/**
 * Public API доменных реплик персонажа.
 *
 * Реплики разнесены по языкам (`ru.ts` / `en.ts`); единая точка доступа —
 * `getClassPhrases(classId, lang)`. Функция чистая и сериализуемая: язык приходит
 * параметром, никакого React/DOM здесь нет (правило домена из AGENTS.md).
 */

import type { PlayerClassId } from '../classes.ts'
import { DEFAULT_LANGUAGE_ID, type LanguageId } from '@shared/locale'
import { PLAYER_PHRASES_RU, DEFAULT_PHRASES_RU } from './ru.ts'
import { PLAYER_PHRASES_EN, DEFAULT_PHRASES_EN } from './en.ts'
import { PLAYER_PHRASES_SR, DEFAULT_PHRASES_SR } from './sr.ts'
import { PLAYER_PHRASES_TT, DEFAULT_PHRASES_TT } from './tt.ts'
import type { ClassPhrases, PhrasesByClass } from './types.ts'

/** Наборы реплик, сгруппированные по языку. */
const PHRASES_BY_LANG: Record<LanguageId, { all: PhrasesByClass; fallback: ClassPhrases }> = {
  ru: { all: PLAYER_PHRASES_RU, fallback: DEFAULT_PHRASES_RU },
  en: { all: PLAYER_PHRASES_EN, fallback: DEFAULT_PHRASES_EN },
  sr: { all: PLAYER_PHRASES_SR, fallback: DEFAULT_PHRASES_SR },
  tt: { all: PLAYER_PHRASES_TT, fallback: DEFAULT_PHRASES_TT },
}

/**
 * Возвращает набор реплик для класса на нужном языке (или нейтральный, если класс
 * не задан). По умолчанию — язык приложения по умолчанию.
 */
export function getClassPhrases(
  classId: PlayerClassId | undefined,
  lang: LanguageId = DEFAULT_LANGUAGE_ID,
): ClassPhrases {
  const set = PHRASES_BY_LANG[lang] ?? PHRASES_BY_LANG[DEFAULT_LANGUAGE_ID]
  return classId ? set.all[classId] : set.fallback
}

export type { ClassPhrases, PhrasesByClass } from './types.ts'
