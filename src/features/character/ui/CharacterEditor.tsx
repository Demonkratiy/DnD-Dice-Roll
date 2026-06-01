/**
 * CharacterEditor — модальное окно редактирования героя: имя + выбор класса.
 *
 * Открывается кликом по имени в шапке (см. RollScreen). Значения приходят пропсами
 * (состояние живёт в app-слое, в CharacterProvider) — фича остаётся «чистой» и не
 * зависит от вышележащих слоёв (правило FSD: импорты только вниз).
 *
 * Класс опционален: кнопка «Без класса» сбрасывает выбор — тогда в шапке снова
 * показывается аморфная руна.
 */

import { PLAYER_CLASSES, ClassIcon, type PlayerClassId } from '@entities/player'
import styles from './CharacterEditor.module.css'

export interface CharacterEditorProps {
  open: boolean
  onClose: () => void
  name: string
  onNameChange: (name: string) => void
  classId: PlayerClassId | undefined
  onClassChange: (classId: PlayerClassId | undefined) => void
}

export function CharacterEditor({
  open,
  onClose,
  name,
  onNameChange,
  classId,
  onClassChange,
}: CharacterEditorProps) {
  if (!open) {
    return null
  }

  /** Выбор класса с клавиатуры (Enter): выбрать и сразу закрыть окно.
   * preventDefault гасит синтетический click от кнопки, чтобы не сработать дважды. */
  const handleClassKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    next: PlayerClassId | undefined,
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      onClassChange(next)
      onClose()
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Редактирование героя"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Герой</h2>
          <button type="button" className={styles.close} aria-label="Закрыть" onClick={onClose}>
            ✕
          </button>
        </div>

        <label className={styles.group}>
          <span className={styles.groupLabel}>Имя</span>
          <input
            className={styles.input}
            type="text"
            value={name}
            maxLength={40}
            placeholder="Имя героя"
            autoFocus
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => {
              // Enter в поле имени — подтверждаем и закрываем окно.
              if (event.key === 'Enter') {
                event.preventDefault()
                onClose()
              }
            }}
          />
        </label>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Класс</span>
          <div className={styles.grid} role="radiogroup" aria-label="Класс героя">
            <button
              type="button"
              className={`${styles.cell} ${styles.cellNone} ${classId === undefined ? styles.active : ''}`}
              role="radio"
              aria-checked={classId === undefined}
              onClick={() => onClassChange(undefined)}
              onKeyDown={(event) => handleClassKeyDown(event, undefined)}
            >
              <span className={styles.cellIcon} aria-hidden="true">
                ∅
              </span>
              <span className={styles.cellLabel}>Без класса</span>
            </button>

            {PLAYER_CLASSES.map((cls) => {
              const active = cls.id === classId
              return (
                <button
                  key={cls.id}
                  type="button"
                  className={`${styles.cell} ${active ? styles.active : ''}`}
                  role="radio"
                  aria-checked={active}
                  onClick={() => onClassChange(cls.id)}
                  onKeyDown={(event) => handleClassKeyDown(event, cls.id)}
                >
                  <ClassIcon classId={cls.id} size={32} className={styles.cellIcon} />
                  <span className={styles.cellLabel}>{cls.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
