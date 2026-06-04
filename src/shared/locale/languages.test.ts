import { describe, it, expect } from 'vitest'
import {
  DEFAULT_LANGUAGE_ID,
  detectPreferredLanguage,
  matchLanguage,
} from './languages.ts'

describe('matchLanguage', () => {
  it('сопоставляет точный код языка', () => {
    expect(matchLanguage('en')).toBe('en')
    expect(matchLanguage('ru')).toBe('ru')
    expect(matchLanguage('sr')).toBe('sr')
    expect(matchLanguage('tt')).toBe('tt')
  })

  it('игнорирует регион и регистр (берёт первичный субтег)', () => {
    expect(matchLanguage('ru-RU')).toBe('ru')
    expect(matchLanguage('EN-US')).toBe('en')
    expect(matchLanguage('sr-Latn-RS')).toBe('sr')
  })

  it('возвращает null для неподдерживаемого или пустого тега', () => {
    expect(matchLanguage('de')).toBeNull()
    expect(matchLanguage('')).toBeNull()
    expect(matchLanguage(null)).toBeNull()
    expect(matchLanguage(undefined)).toBeNull()
  })
})

describe('detectPreferredLanguage', () => {
  it('берёт первый поддерживаемый язык из списка предпочтений', () => {
    expect(detectPreferredLanguage(['de', 'ru-RU', 'en'])).toBe('ru')
    expect(detectPreferredLanguage(['fr', 'tt'])).toBe('tt')
  })

  it('возвращает дефолтный язык, если ни один не поддерживается', () => {
    expect(detectPreferredLanguage(['de', 'fr', 'es'])).toBe(DEFAULT_LANGUAGE_ID)
  })

  it('возвращает дефолтный язык для пустого или отсутствующего списка', () => {
    expect(detectPreferredLanguage([])).toBe(DEFAULT_LANGUAGE_ID)
    expect(detectPreferredLanguage(undefined)).toBe(DEFAULT_LANGUAGE_ID)
  })
})
