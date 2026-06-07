/**
 * SettingsPanel — модальное окно настроек: тема, показ логов, отключение анимаций.
 *
 * Значения настроек приходят пропсами (состояние живёт в app-слое) — фича остаётся
 * «чистой» и не зависит от вышележащих слоёв (правило FSD: импорты только вниз).
 */

import { Switch, Segmented } from '@shared/ui'
import type { LoadedRollMode } from '@shared/lib'
import { useOnEscape } from '@shared/lib'
import { DEV_TOOLS_ENABLED } from '@shared/config'
import { noopSoundPlayer, type SoundPlayer } from '@shared/services'
import {
  useShape,
  SHAPES,
  type ShapeId,
  useColor,
  COLORS,
  type ColorId,
} from '@shared/theme'
import { useLanguage, useT, LANGUAGES, type LanguageId } from '@shared/locale'
import styles from './SettingsPanel.module.css'

/** Режим DEV-«форс-броска»: выкл. / всегда макс (нат-20) / всегда мин (нат-1). */
export type ForceRollMode = LoadedRollMode | 'off'

export interface SettingsPanelProps {
  open: boolean
  onClose: () => void
  showLogs: boolean
  onShowLogsChange: (value: boolean) => void
  disableAnimations: boolean
  onDisableAnimationsChange: (value: boolean) => void
  soundEnabled: boolean
  onSoundEnabledChange: (value: boolean) => void
  /** DEV-only: форс-бросок для теста крит-эффектов. */
  forceRoll: ForceRollMode
  onForceRollChange: (value: ForceRollMode) => void
  /** Опционально: проигрыватель UI-звуков (тумблеры, переключатели). */
  soundPlayer?: SoundPlayer
}

export function SettingsPanel({
  open,
  onClose,
  showLogs,
  onShowLogsChange,
  disableAnimations,
  onDisableAnimationsChange,
  soundEnabled,
  onSoundEnabledChange,
  forceRoll,
  onForceRollChange,
  soundPlayer = noopSoundPlayer,
}: SettingsPanelProps) {
  const { shapeId, setShape } = useShape()
  const { colorId, setColor } = useColor()
  const { lang, setLanguage } = useLanguage()
  const t = useT()

  // Закрытие по Esc (пока окно открыто). Идёт через onClose, поэтому звук
  // panelClose отыгрывается тем же путём, что и клик по фону/✕.
  useOnEscape(open, onClose)

  if (!open) {
    return null
  }

  /** Тумблер: звук зависит от нового состояния (вкл — выше, выкл — ниже). */
  const handleToggle = (onChange: (value: boolean) => void) => (value: boolean) => {
    soundPlayer.play(value ? 'toggleOn' : 'toggleOff')
    onChange(value)
  }

  const themeOptions = SHAPES.map((shape) => ({ value: shape.id, label: t.themeNames[shape.id] }))
  const accentOptions = COLORS.map((color) => ({ value: color.id, label: t.colorNames[color.id] }))
  const languageOptions = LANGUAGES.map((language) => ({ value: language.id, label: language.name }))

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={t.settings.ariaLabel}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{t.settings.title}</h2>
          <button type="button" className={styles.close} aria-label={t.settings.close} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>{t.language.label}</span>
          <Segmented
            label={t.language.label}
            options={languageOptions}
            value={lang}
            onChange={(value: LanguageId) => {
              soundPlayer.play('segment')
              setLanguage(value)
            }}
          />
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>{t.settings.theme}</span>
          <Segmented
            label={t.settings.themeAria}
            options={themeOptions}
            value={shapeId}
            onChange={(value: ShapeId) => {
              soundPlayer.play('segment')
              setShape(value)
            }}
          />
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>{t.settings.color}</span>
          <Segmented
            label={t.settings.colorAria}
            options={accentOptions}
            value={colorId}
            onChange={(value: ColorId) => {
              soundPlayer.play('segment')
              setColor(value)
            }}
          />
        </div>

        <div className={styles.group}>
          <Switch label={t.settings.showLogs} checked={showLogs} onChange={handleToggle(onShowLogsChange)} />
          <Switch
            label={t.settings.disableAnimations}
            checked={disableAnimations}
            onChange={handleToggle(onDisableAnimationsChange)}
          />
          <Switch
            label={t.settings.sound}
            checked={soundEnabled}
            onChange={handleToggle(onSoundEnabledChange)}
          />
        </div>

        {DEV_TOOLS_ENABLED && (
          <div className={styles.group}>
            <span className={styles.groupLabel}>Force roll (dev)</span>
            <Segmented<ForceRollMode>
              label="Force roll (dev)"
              options={[
                { value: 'off', label: 'Off' },
                { value: 'max', label: 'Nat 20' },
                { value: 'min', label: 'Nat 1' },
              ]}
              value={forceRoll}
              onChange={onForceRollChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}
