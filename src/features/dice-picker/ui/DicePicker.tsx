/**
 * DicePicker — лента выбора номинала кубика (d4…d100).
 * Выбранный кубик подсвечивается ореолом и становится чуть крупнее.
 */

import { DIE_TYPES, Die, type DieType } from '@entities/die'
import { useT } from '@shared/locale'
import styles from './DicePicker.module.css'

export interface DicePickerProps {
  value: DieType
  onChange: (die: DieType) => void
}

export function DicePicker({ value, onChange }: DicePickerProps) {
  const t = useT()
  return (
    <div className={styles.picker} role="radiogroup" aria-label={t.dicePicker.groupAria}>
      {DIE_TYPES.map((die) => {
        const selected = die === value
        return (
          <button
            key={die}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={die}
            className={`${styles.item} ${selected ? styles.selectedItem : ''}`}
            onClick={() => onChange(die)}
          >
            <Die die={die} selected={selected} size={selected ? 60 : 48} />
            <span className={styles.caption}>{die}</span>
          </button>
        )
      })}
    </div>
  )
}
