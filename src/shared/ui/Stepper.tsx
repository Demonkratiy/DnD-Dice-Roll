/** Stepper — числовой инпут с кнопками −/+ и ограничением диапазона. */

import styles from './Stepper.module.css'

export interface StepperProps {
  label: string
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  /** Префикс к значению (например "+" для модификатора). */
  format?: (value: number) => string
}

export function Stepper({ label, value, min, max, onChange, format }: StepperProps) {
  const canDecrease = min == null || value > min
  const canIncrease = max == null || value < max

  return (
    <div className={styles.stepper}>
      <span className={styles.label}>{label}</span>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.button}
          aria-label={`${label}: уменьшить`}
          disabled={!canDecrease}
          onClick={() => onChange(value - 1)}
        >
          −
        </button>
        <span className={styles.value} aria-live="polite">
          {format ? format(value) : value}
        </span>
        <button
          type="button"
          className={styles.button}
          aria-label={`${label}: увеличить`}
          disabled={!canIncrease}
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  )
}
