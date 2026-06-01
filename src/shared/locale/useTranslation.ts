/**
 * Хук-переводчик: возвращает словарь для текущего языка.
 *
 * Используется как `const t = useT()` → далее типобезопасный доступ к строкам
 * через вложенные поля: `t.settings.title`, `t.classNames[classId]`.
 */

import { useLanguage } from './languageContext.ts'
import { DICTIONARIES, type Dictionary } from './dictionaries/dictionary.ts'

export function useT(): Dictionary {
  return DICTIONARIES[useLanguage().lang]
}
