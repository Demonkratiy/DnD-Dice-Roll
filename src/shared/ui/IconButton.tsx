/** IconButton — круглая кнопка с иконкой/символом. Требует aria-label. */

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './IconButton.module.css'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  children: ReactNode
}

export function IconButton({ label, className, children, ...rest }: IconButtonProps) {
  const classes = [styles.iconButton, className ?? ''].filter(Boolean).join(' ')
  return (
    <button className={classes} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  )
}
