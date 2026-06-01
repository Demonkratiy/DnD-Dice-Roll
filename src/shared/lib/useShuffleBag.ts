/**
 * useShuffleBag — «мешок» (колода) для выдачи элементов без частых повторов.
 *
 * Обычный `Math.random()` при каждом выборе независим, поэтому одни и те же
 * элементы (например, реплики героя) легко выпадают подряд несколько раз.
 *
 * Этот хук реализует паттерн «shuffle bag»: исходный список перемешивается и
 * выдаётся по одному, пока не закончится; затем мешок наполняется и тасуется
 * заново. Так каждый элемент показывается ровно один раз за «круг», а повторы
 * на стыке двух кругов дополнительно подавляются (новый круг не начинается с
 * только что показанного элемента).
 *
 * Источник случайности можно инъектировать (`Rng`) ради тестируемости.
 */

import { useCallback, useRef } from 'react'
import { createMathRandomRng, type Rng } from './rng.ts'

/** Стабильный генератор по умолчанию (одна ссылка на весь модуль). */
const defaultRng = createMathRandomRng()

/** Перемешивание Фишера—Йейтса в новый массив (исходный не мутируется). */
function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = items.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Возвращает функцию `next()`, выдающую элементы списка без частых повторов.
 *
 * Если список меняется по ссылке, мешок пересоздаётся под новый список.
 */
export function useShuffleBag<T>(items: readonly T[], rng: Rng = defaultRng): () => T {
  // Текущий мешок (выдаём элементы с конца через pop), последний показанный
  // элемент и ссылка на список — чтобы переинициализироваться при его смене.
  const bagRef = useRef<T[]>([])
  const sourceRef = useRef<readonly T[]>(items)
  const lastRef = useRef<T | undefined>(undefined)

  return useCallback(() => {
    const refill = sourceRef.current !== items || bagRef.current.length === 0
    if (refill) {
      sourceRef.current = items
      const next = shuffle(items, rng)
      // Подавляем повтор на стыке кругов: если следующим выпадет только что
      // показанный элемент, меняем его местами с соседним (когда есть выбор).
      if (items.length > 1 && next[next.length - 1] === lastRef.current) {
        ;[next[next.length - 1], next[0]] = [next[0], next[next.length - 1]]
      }
      bagRef.current = next
    }

    const picked = bagRef.current.pop() as T
    lastRef.current = picked
    return picked
  }, [items, rng])
}
