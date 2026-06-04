import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { AppProviders } from '../providers'
import { RollScreen } from './RollScreen.tsx'

/**
 * Регрессионный контракт «черновика броска» при смене номинала кубика.
 *
 * Правило (см. RollScreen.handleDieChange): каждый номинал — это, как правило,
 * отдельная проверка со своими количеством костей и модификатором, поэтому при
 * ЛЮБОЙ смене кубика черновик сбрасывается к дефолтам (1 кость, без модификатора,
 * обычный режим). Повторный выбор того же номинала ничего не сбрасывает.
 *
 * Тест прогоняет реальную цепочку UI: клик по кубику в ленте (DicePicker) →
 * handleDieChange → значения в RollControls. Так мы ловим регрессию, даже если
 * сломается проводка между компонентами, а не только сама функция.
 */

// jsdom не реализует matchMedia, а ShapeProvider дергает его при инициализации
// (prefers-color-scheme). Отдаём безопасную заглушку «нет предпочтения».
beforeEach(() => {
  window.localStorage.clear()
  // Фиксируем язык EN — подписи контролов становятся детерминированными.
  window.localStorage.setItem('ddr.lang', 'en')
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function renderScreen() {
  render(
    <AppProviders>
      <RollScreen />
    </AppProviders>,
  )
}

/** Кликает по кубику в ленте выбора (DicePicker) по его подписи (d4…d100). */
function selectDie(name: string) {
  fireEvent.click(screen.getByRole('radio', { name }))
}

/**
 * Читает текущее значение степпера по aria-label его кнопки «увеличить».
 * Значение лежит в соседнем span (aria-live) внутри той же группы контролов.
 */
function readStepper(increaseLabel: string): string {
  const increase = screen.getByLabelText(increaseLabel)
  const value = increase.parentElement?.querySelector('[aria-live="polite"]')
  return value?.textContent?.trim() ?? ''
}

const COUNT_INC = 'Dice: увеличить'
const MODIFIER_INC = 'Modifier: увеличить'

describe('RollScreen — сброс черновика при смене кубика', () => {
  it('сбрасывает количество и модификатор при смене номинала', () => {
    renderScreen()
    selectDie('d6')

    fireEvent.click(screen.getByLabelText(COUNT_INC))
    fireEvent.click(screen.getByLabelText(COUNT_INC))
    fireEvent.click(screen.getByLabelText(MODIFIER_INC))
    fireEvent.click(screen.getByLabelText(MODIFIER_INC))
    expect(readStepper(COUNT_INC)).toBe('3')
    expect(readStepper(MODIFIER_INC)).toBe('+2')

    selectDie('d8')
    expect(readStepper(COUNT_INC)).toBe('1')
    expect(readStepper(MODIFIER_INC)).toBe('0')
  })

  it('не сбрасывает черновик при повторном выборе того же номинала', () => {
    renderScreen()
    selectDie('d6')

    fireEvent.click(screen.getByLabelText(COUNT_INC))
    fireEvent.click(screen.getByLabelText(MODIFIER_INC))
    expect(readStepper(COUNT_INC)).toBe('2')
    expect(readStepper(MODIFIER_INC)).toBe('+1')

    selectDie('d6') // тот же номинал — ничего не трогаем
    expect(readStepper(COUNT_INC)).toBe('2')
    expect(readStepper(MODIFIER_INC)).toBe('+1')
  })

  it('сбрасывает режим преимущества и размер пула при уходе с d20', () => {
    renderScreen()
    // По умолчанию d20. Барабаном (стрелка вниз) выбираем «преимущество»:
    // режим → advantage, количество (размер пула) → 2.
    const wheel = screen.getByRole('radiogroup', { name: 'Roll mode' })
    fireEvent.keyDown(wheel, { key: 'ArrowDown' })
    expect(screen.getByRole('radio', { name: 'Adv.' })).toBeChecked()

    // Уходим на d6: пул преимущества и режим должны сброситься.
    selectDie('d6')
    expect(readStepper(COUNT_INC)).toBe('1')
    expect(readStepper(MODIFIER_INC)).toBe('0')

    // Возвращаемся на d20 — барабан снова в «обычном» режиме.
    selectDie('d20')
    expect(screen.getByRole('radio', { name: 'Normal' })).toBeChecked()
  })
})
