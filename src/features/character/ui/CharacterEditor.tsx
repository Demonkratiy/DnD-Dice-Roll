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
import { useT } from '@shared/locale'
import { noopSoundPlayer, type SoundPlayer } from '@shared/services'
import styles from './CharacterEditor.module.css'

export interface CharacterEditorProps {
  open: boolean
  onClose: () => void
  name: string
  onNameChange: (name: string) => void
  classId: PlayerClassId | undefined
  onClassChange: (classId: PlayerClassId | undefined) => void
  /** Опционально: проигрыватель UI-звуков (выбор класса). */
  soundPlayer?: SoundPlayer
}

export function CharacterEditor({
  open,
  onClose,
  name,
  onNameChange,
  classId,
  onClassChange,
  soundPlayer = noopSoundPlayer,
}: CharacterEditorProps) {
  const t = useT()

  if (!open) {
    return null
  }

  /** Выбор класса: тёплый щипок + проброс наружу. */
  const selectClass = (next: PlayerClassId | undefined) => {
    soundPlayer.play('selectClass')
    onClassChange(next)
  }

  /** Выбор класса с клавиатуры (Enter): выбрать и сразу закрыть окно.
   * preventDefault гасит синтетический click от кнопки, чтобы не сработать дважды. */
  const handleClassKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    next: PlayerClassId | undefined,
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      selectClass(next)
      onClose()
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={t.character.ariaLabel}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{t.character.title}</h2>
          <button type="button" className={styles.close} aria-label={t.character.close} onClick={onClose}>
            ✕
          </button>
        </div>

        <label className={styles.group}>
          <span className={styles.groupLabel}>{t.character.nameLabel}</span>
          <input
            className={styles.input}
            type="text"
            value={name}
            maxLength={40}
            placeholder={t.character.namePlaceholder}
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
          <span className={styles.groupLabel}>{t.character.classLabel}</span>
          <div className={styles.grid} role="radiogroup" aria-label={t.character.classAria}>
            <button
              type="button"
              className={`${styles.cell} ${styles.cellNone} ${classId === undefined ? styles.active : ''}`}
              role="radio"
              aria-checked={classId === undefined}
              onClick={() => selectClass(undefined)}
              onKeyDown={(event) => handleClassKeyDown(event, undefined)}
            >
              <span className={styles.cellIcon} aria-hidden="true">
                ∅
              </span>
              <span className={styles.cellLabel}>{t.character.noClass}</span>
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
                  onClick={() => selectClass(cls.id)}
                  onKeyDown={(event) => handleClassKeyDown(event, cls.id)}
                >
                  <ClassIcon classId={cls.id} size={32} className={styles.cellIcon} />
                  <span className={styles.cellLabel}>{t.classNames[cls.id]}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
