import { describe, it, expect } from 'vitest'
import {
  getPressTier,
  CHARGED_PRESS_INTENSITY,
  EPIC_PRESS_INTENSITY,
} from './pressTier.ts'

describe('getPressTier', () => {
  it('возвращает normal для слабого зажатия', () => {
    expect(getPressTier(0)).toBe('normal')
    expect(getPressTier(CHARGED_PRESS_INTENSITY - 0.01)).toBe('normal')
  })

  it('возвращает charged на пороге заряда и выше (но ниже эпика)', () => {
    expect(getPressTier(CHARGED_PRESS_INTENSITY)).toBe('charged')
    expect(getPressTier(EPIC_PRESS_INTENSITY - 0.01)).toBe('charged')
  })

  it('возвращает epic на пороге эпика и до максимума', () => {
    expect(getPressTier(EPIC_PRESS_INTENSITY)).toBe('epic')
    expect(getPressTier(1)).toBe('epic')
  })
})
