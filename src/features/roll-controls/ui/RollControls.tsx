/**
 * RollControls — настройки текущего броска:
 *  - количество кубиков;
 *  - модификатор (+/−);
 *  - режим преимущество/обычный/помеха (показывается только для d20).
 */

import { Stepper, Segmented } from '@shared/ui'
import type { DieType } from '@entities/die'
import type { RollMode } from '@entities/roll'
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

const MODE_OPTIONS: { value: RollMode; label: string }[] = [
  { value: 'disadvantage', label: 'Помеха' },
  { value: 'normal', label: 'Обычный' },
  { value: 'advantage', label: 'Преим.' },
]

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
  return (
    <div className={styles.controls}>
      <Stepper label="Кубики" value={count} min={1} max={maxCount} onChange={onCountChange} />
      <Stepper
        label="Модификатор"
        value={modifier}
        min={-20}
        max={20}
        onChange={onModifierChange}
        format={(v) => (v > 0 ? `+${v}` : `${v}`)}
      />
      {die === 'd20' && (
        <div className={styles.mode}>
          <Segmented label="Режим броска" options={MODE_OPTIONS} value={mode} onChange={onModeChange} />
        </div>
      )}
    </div>
  )
}
