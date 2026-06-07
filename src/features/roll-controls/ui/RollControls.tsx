/**
 * RollControls — настройки текущего броска:
 *  - количество кубиков (для обычных кубиков, кроме d20);
 *  - модификатор (+/−);
 *  - для d20 — вертикальный барабан выбора варианта «помеха · обычный ·
 *    преимущество · эльфийская меткость». Барабан компактен по высоте и не растёт
 *    от числа пунктов, поэтому эльфийская меткость снова живёт общим пунктом.
 */

import { Stepper, WheelPicker } from '@shared/ui'
import type { DieType } from '@entities/die'
import type { RollMode } from '@entities/roll'
import { useT } from '@shared/locale'
import { noopSoundPlayer, type SoundPlayer } from '@shared/services'
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
  /** Звуковой отклик на действия (шаги +/−, смена режима). По умолчанию тихий. */
  soundPlayer?: SoundPlayer
}

/**
 * Варианты броска d20. Каждый — это пара (режим, размер пула):
 *  - помеха: 2 кости, берём меньшую;
 *  - обычный: 1 кость;
 *  - преимущество: 2 кости, берём большую;
 *  - эльфийская меткость: 3 кости, берём большую.
 */
type D20Option = 'disadvantage' | 'normal' | 'advantage' | 'elven'

const D20_VARIANTS: Record<D20Option, { mode: RollMode; count: number }> = {
  disadvantage: { mode: 'disadvantage', count: 2 },
  normal: { mode: 'normal', count: 1 },
  advantage: { mode: 'advantage', count: 2 },
  elven: { mode: 'advantage', count: 3 },
}

/** Сводит текущие (режим, количество) к выбранному варианту d20. */
function toD20Option(mode: RollMode, count: number): D20Option {
  if (mode === 'disadvantage') return 'disadvantage'
  if (mode === 'advantage') return count >= 3 ? 'elven' : 'advantage'
  return 'normal'
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
  soundPlayer = noopSoundPlayer,
}: RollControlsProps) {
  const t = useT()
  const isD20 = die === 'd20'

  const d20Options: { value: D20Option; label: string }[] = [
    { value: 'disadvantage', label: t.rollControls.modeDisadvantage },
    { value: 'normal', label: t.rollControls.modeNormal },
    { value: 'advantage', label: t.rollControls.modeAdvantage },
    { value: 'elven', label: t.rollControls.modeElven },
  ]

  // Шаг степпера озвучиваем по направлению: вверх — выше тон, вниз — ниже.
  const handleCountChange = (next: number) => {
    soundPlayer.play(next > count ? 'stepUp' : 'stepDown')
    onCountChange(next)
  }
  const handleModifierChange = (next: number) => {
    soundPlayer.play(next > modifier ? 'stepUp' : 'stepDown')
    onModifierChange(next)
  }

  const handleD20Change = (option: D20Option) => {
    const variant = D20_VARIANTS[option]
    soundPlayer.play('modeShift')
    onModeChange(variant.mode)
    onCountChange(variant.count)
  }

  return (
    <div className={styles.controls}>
      {!isD20 && (
        <Stepper label={t.rollControls.count} value={count} min={1} max={maxCount} onChange={handleCountChange} />
      )}
      <Stepper
        label={t.rollControls.modifier}
        value={modifier}
        min={-20}
        max={20}
        onChange={handleModifierChange}
        format={(v) => (v > 0 ? `+${v}` : `${v}`)}
      />
      {isD20 && (
        <div className={styles.mode}>
          <span className={styles.modeLabel}>{t.rollControls.modeLabel}</span>
          <WheelPicker
            label={t.rollControls.modeAria}
            options={d20Options}
            value={toD20Option(mode, count)}
            onChange={handleD20Change}
            railLabel={t.rollControls.modeBeyond}
          />
        </div>
      )}
    </div>
  )
}
