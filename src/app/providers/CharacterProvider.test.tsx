import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { CharacterProvider } from './CharacterProvider.tsx'
import { useCharacter } from './characterContext.ts'

const STORAGE_KEY = 'ddr.character'

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(cleanup)

function wrapper({ children }: { children: ReactNode }) {
  return <CharacterProvider>{children}</CharacterProvider>
}

/** Маленький потребитель контекста для проверки значений и экшенов в DOM. */
function Probe() {
  const { name, classId, setName, setClassId } = useCharacter()
  return (
    <div>
      <span data-testid="name">{name}</span>
      <span data-testid="class">{classId ?? 'none'}</span>
      <button onClick={() => setName('Тассельхоф')}>set-name</button>
      <button onClick={() => setClassId('rogue')}>set-class</button>
      <button onClick={() => setClassId(undefined)}>clear-class</button>
    </div>
  )
}

describe('useCharacter', () => {
  it('бросает ошибку вне провайдера', () => {
    expect(() => renderHook(() => useCharacter())).toThrow(/CharacterProvider/)
  })
})

describe('CharacterProvider', () => {
  it('использует значения по умолчанию при пустом хранилище', () => {
    render(<Probe />, { wrapper })
    expect(screen.getByTestId('name').textContent).not.toBe('')
    expect(screen.getByTestId('class')).toHaveTextContent('none')
  })

  it('читает сохранённого героя из localStorage', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ name: 'Дриззт', classId: 'ranger' }),
    )
    render(<Probe />, { wrapper })
    expect(screen.getByTestId('name')).toHaveTextContent('Дриззт')
    expect(screen.getByTestId('class')).toHaveTextContent('ranger')
  })

  it('игнорирует недопустимый класс из хранилища', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ name: 'Без класса', classId: 'totally-not-a-class' }),
    )
    render(<Probe />, { wrapper })
    expect(screen.getByTestId('class')).toHaveTextContent('none')
  })

  it('переживает повреждённый JSON, откатываясь к значениям по умолчанию', () => {
    window.localStorage.setItem(STORAGE_KEY, '{ не json')
    render(<Probe />, { wrapper })
    expect(screen.getByTestId('class')).toHaveTextContent('none')
  })

  it('сохраняет изменение имени в localStorage', () => {
    render(<Probe />, { wrapper })
    fireEvent.click(screen.getByText('set-name'))
    expect(screen.getByTestId('name')).toHaveTextContent('Тассельхоф')
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.name).toBe('Тассельхоф')
  })

  it('сохраняет и сбрасывает класс', () => {
    render(<Probe />, { wrapper })

    fireEvent.click(screen.getByText('set-class'))
    expect(screen.getByTestId('class')).toHaveTextContent('rogue')
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}').classId).toBe('rogue')

    fireEvent.click(screen.getByText('clear-class'))
    expect(screen.getByTestId('class')).toHaveTextContent('none')
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}').classId ?? null,
    ).toBeNull()
  })

  it('обновляет значение через хук useCharacter', () => {
    const { result } = renderHook(() => useCharacter(), { wrapper })
    act(() => result.current.setClassId('cleric'))
    expect(result.current.classId).toBe('cleric')
  })
})
