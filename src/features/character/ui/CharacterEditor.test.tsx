import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { LanguageProvider } from '@shared/locale'
import { CharacterEditor, type CharacterEditorProps } from './CharacterEditor.tsx'

afterEach(cleanup)

/** Рендерит редактор с дефолтными пропсами; переопределяемые поля — через overrides. */
function setup(overrides: Partial<CharacterEditorProps> = {}) {
  const props: CharacterEditorProps = {
    open: true,
    onClose: vi.fn(),
    name: 'Авалон',
    onNameChange: vi.fn(),
    classId: undefined,
    onClassChange: vi.fn(),
    ...overrides,
  }
  render(
    <LanguageProvider>
      <CharacterEditor {...props} />
    </LanguageProvider>,
  )
  return props
}

describe('CharacterEditor', () => {
  it('ничего не рендерит, когда закрыт', () => {
    setup({ open: false })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('показывает текущее имя в поле ввода', () => {
    setup({ name: 'Гэндальф' })
    expect(screen.getByRole('textbox', { name: 'Имя' })).toHaveValue('Гэндальф')
  })

  it('сообщает об изменении имени', () => {
    const { onNameChange } = setup()
    fireEvent.change(screen.getByRole('textbox', { name: 'Имя' }), {
      target: { value: 'Радагаст' },
    })
    expect(onNameChange).toHaveBeenCalledWith('Радагаст')
  })

  it('Enter в поле имени закрывает окно', () => {
    const { onClose } = setup()
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Имя' }), { key: 'Enter' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('клик по классу выбирает его (без закрытия окна)', () => {
    const { onClassChange, onClose } = setup()
    fireEvent.click(screen.getByRole('radio', { name: /Волшебник/ }))
    expect(onClassChange).toHaveBeenCalledWith('wizard')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('клик по «Без класса» сбрасывает выбор', () => {
    const { onClassChange } = setup({ classId: 'wizard' })
    fireEvent.click(screen.getByRole('radio', { name: /Без класса/ }))
    expect(onClassChange).toHaveBeenCalledWith(undefined)
  })

  it('Enter на классе выбирает его и закрывает окно', () => {
    const { onClassChange, onClose } = setup()
    fireEvent.keyDown(screen.getByRole('radio', { name: /Варвар/ }), { key: 'Enter' })
    expect(onClassChange).toHaveBeenCalledWith('barbarian')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Enter на «Без класса» сбрасывает выбор и закрывает окно', () => {
    const { onClassChange, onClose } = setup({ classId: 'wizard' })
    fireEvent.keyDown(screen.getByRole('radio', { name: /Без класса/ }), { key: 'Enter' })
    expect(onClassChange).toHaveBeenCalledWith(undefined)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('отмечает выбранный класс как aria-checked', () => {
    setup({ classId: 'wizard' })
    expect(screen.getByRole('radio', { name: /Волшебник/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Варвар/ })).not.toBeChecked()
  })

  it('закрывается по клику на оверлей и не закрывается по клику внутри панели', () => {
    const { onClose } = setup()
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()

    // Кнопка «Закрыть» внутри панели — явное закрытие.
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
