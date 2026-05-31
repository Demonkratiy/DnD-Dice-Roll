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

  if (!open) {
    return null
  }

  const themeOptions = SHAPES.map((shape) => ({ value: shape.id, label: shape.name }))
  const accentOptions = COLORS.map((color) => ({ value: color.id, label: color.name }))

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Настройки"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Настройки</h2>
          <button type="button" className={styles.close} aria-label="Закрыть" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Тема</span>
          <Segmented
            label="Тема оформления"
            options={themeOptions}
            value={shapeId}
            onChange={(value: ShapeId) => setShape(value)}
          />
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Цвет</span>
          <Segmented
            label="Цветовая палитра"
            options={accentOptions}
            value={colorId}
            onChange={(value: ColorId) => setColor(value)}
          />
        </div>

        <div className={styles.group}>
          <Switch label="Показывать логи бросков" checked={showLogs} onChange={onShowLogsChange} />
          <Switch
            label="Отключить анимации"
            checked={disableAnimations}
            onChange={onDisableAnimationsChange}
          />
        </div>
      </div>
    </div>
  )
}
