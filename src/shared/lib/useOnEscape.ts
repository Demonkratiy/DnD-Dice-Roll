/**
 * useOnEscape — вызывает `handler`, когда пользователь нажимает Esc.
 *
 * Подписка живёт, только пока `active` === true (например, окно открыто), —
 * закрытые модалки не должны перехватывать Esc. Слушаем на `window`, чтобы
 * сработать независимо от того, где сейчас фокус.
 */

import { useEffect } from 'react'

export function useOnEscape(active: boolean, handler: () => void): void {
  useEffect(() => {
    if (!active) {
      return
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handler()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active, handler])
}
