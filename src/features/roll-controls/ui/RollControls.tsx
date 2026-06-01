/**
 * RollControls — настройки текущего броска:
 *  - количество кубиков;
 *  - модификатор (+/−);
 *  - режим преимущество/обычный/помеха (показывается только для d20).
 */

import { Stepper, Segmented } from '@shared/ui'
import type { DieType } from '@entities/die'
import type { RollMode } from '@entities/roll'
import { useT } from '@shared/locale'
import styles from './RollControls.module.css'

export interface RollControlsProps {
  die: DieType
  count: number
  modifier: number
  mode: RollMode
  onCountChange: (count: number) => void
  onModifierChange: (modifier: number) => void
  onModeChange: (mode: RollMode) => void
  maxCount?: number
}

export function RollControls({
  die,
  count,
  modifier,
  mode,
  onCountChange,
  onModifierChange,
  onModeChange,
  maxCount = 12,
}: RollControlsProps) {
  const t = useT()
  const modeOptions: { value: RollMode; label: string }[] = [
    { value: 'disadvantage', label: t.rollControls.modeDisadvantage },
    { value: 'normal', label: t.rollControls.modeNormal },
    { value: 'advantage', label: t.rollControls.modeAdvantage },
  ]

  return (
    <div className={styles.controls}>
      <Stepper label={t.rollControls.count} value={count} min={1} max={maxCount} onChange={onCountChange} />
      <Stepper
        label={t.rollControls.modifier}
        value={modifier}
        min={-20}
        max={20}
        onChange={onModifierChange}
        format={(v) => (v > 0 ? `+${v}` : `${v}`)}
      />
      {die === 'd20' && (
        <div className={styles.mode}>
          <Segmented label={t.rollControls.modeAria} options={modeOptions} value={mode} onChange={onModeChange} />
        </div>
      )}
    </div>
  )
}
