/**
 * SettingsPanel — модальное окно настроек: тема, показ логов, отключение анимаций.
 *
 * Значения настроек приходят пропсами (состояние живёт в app-слое) — фича остаётся
 * «чистой» и не зависит от вышележащих слоёв (правило FSD: импорты только вниз).
 */

import { Switch, Segmented } from '@shared/ui'
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

export interface SettingsPanelProps {
  open: boolean
  onClose: () => void
  showLogs: boolean
  onShowLogsChange: (value: boolean) => void
  disableAnimations: boolean
  onDisableAnimationsChange: (value: boolean) => void
}

export function SettingsPanel({
  open,
  onClose,
  showLogs,
  onShowLogsChange,
  disableAnimations,
  onDisableAnimationsChange,
}: SettingsPanelProps) {
  const { shapeId, setShape } = useShape()
  const { colorId, setColor } = useColor()
  const { lang, setLanguage } = useLanguage()
  const t = useT()

  if (!open) {
    return null
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
            onChange={(value: LanguageId) => setLanguage(value)}
          />
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>{t.settings.theme}</span>
          <Segmented
            label={t.settings.themeAria}
            options={themeOptions}
            value={shapeId}
            onChange={(value: ShapeId) => setShape(value)}
          />
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>{t.settings.color}</span>
          <Segmented
            label={t.settings.colorAria}
            options={accentOptions}
            value={colorId}
            onChange={(value: ColorId) => setColor(value)}
          />
        </div>

        <div className={styles.group}>
          <Switch label={t.settings.showLogs} checked={showLogs} onChange={onShowLogsChange} />
          <Switch
            label={t.settings.disableAnimations}
            checked={disableAnimations}
            onChange={onDisableAnimationsChange}
          />
        </div>
      </div>
    </div>
  )
}
