/**
 * Тип словаря и таблица словарей по языкам.
 *
 * `Dictionary` выводится из русского словаря — он канонично задаёт набор ключей.
 * Любой новый язык типизируется как `Dictionary`, поэтому пропущенный ключ —
 * ошибка компиляции, а не «тихая» дыра в переводе.
 */

import type { LanguageId } from '../languages.ts'
import { ru } from './ru.ts'
import { en } from './en.ts'
import { sr } from './sr.ts'
import { tt } from './tt.ts'

/** Форма словаря UI-строк (по русскому как источнику истины). */
export type Dictionary = typeof ru

/** Все словари по идентификатору языка. */
export const DICTIONARIES: Record<LanguageId, Dictionary> = { ru, en, sr, tt }
