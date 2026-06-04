import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { WheelPicker, type WheelPickerOption } from './WheelPicker.tsx'

afterEach(cleanup)

type Mode = 'low' | 'mid' | 'high'

const OPTIONS: WheelPickerOption<Mode>[] = [
  { value: 'low', label: 'Низкий' },
  { value: 'mid', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
]

/**
 * Тесты покрывают контракт компонента (рендер, доступность, клавиатура,
 * onChange). Геометрию выбора мышью (scroll-snap, getBoundingClientRect) jsdom
 * не считает — она проверяется вживую в браузере, не здесь.
 */
function setup(overrides: Partial<React.ComponentProps<typeof WheelPicker<Mode>>> = {}) {
  const onChange = vi.fn()
  render(
    <WheelPicker<Mode>
      label="Уровень"
      options={OPTIONS}
      value="mid"
      onChange={onChange}
      {...overrides}
    />,
  )
  return { onChange }
}

describe('WheelPicker', () => {
  it('рендерит все опции как radio', () => {
    setup()
    expect(screen.getAllByRole('radio')).toHaveLength(OPTIONS.length)
  })

  it('помечает выбранный пункт через aria-checked', () => {
    setup({ value: 'mid' })
    expect(screen.getByRole('radio', { name: 'Средний' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Низкий' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Высокий' })).not.toBeChecked()
  })

  it('стрелка вниз выбирает следующий пункт', () => {
    const { onChange } = setup({ value: 'mid' })
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowDown' })
    expect(onChange).toHaveBeenCalledWith('high')
  })

  it('стрелка вверх выбирает предыдущий пункт', () => {
    const { onChange } = setup({ value: 'mid' })
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowUp' })
    expect(onChange).toHaveBeenCalledWith('low')
  })

  it('не выходит за нижнюю границу', () => {
    const { onChange } = setup({ value: 'high' })
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowDown' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('не выходит за верхнюю границу', () => {
    const { onChange } = setup({ value: 'low' })
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowUp' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('клик по пункту в раскрытом барабане выбирает его', () => {
    const { onChange } = setup({ value: 'mid' })
    // Раскрываем барабан фокусом (клавиатурный путь — device-agnostic). Выбор
    // мышью/тачем считается геометрически по координатам указателя и проверяется
    // вживую в браузере (e2e); здесь покрываем доступный click-fallback: click
    // по пункту в раскрытом барабане должен его выбрать.
    fireEvent.focus(screen.getByRole('radiogroup'))
    fireEvent.click(screen.getByRole('radio', { name: 'Высокий' }))
    expect(onChange).toHaveBeenCalledWith('high')
  })

  it('рендерит декоративный railLabel сверху и снизу', () => {
    setup({ railLabel: '✦ За гранью ✦' })
    const rails = screen.getAllByText('✦ За гранью ✦')
    expect(rails).toHaveLength(2)
    rails.forEach((rail) => expect(rail).toHaveAttribute('aria-hidden', 'true'))
  })

  it('без railLabel «рельсы» не рендерятся', () => {
    setup()
    expect(screen.queryByText(/За гранью/)).toBeNull()
  })

  it('прокидывает label как aria-label группы', () => {
    setup({ label: 'Режим броска' })
    expect(screen.getByRole('radiogroup', { name: 'Режим броска' })).toBeInTheDocument()
  })
})
