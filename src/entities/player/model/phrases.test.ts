import { describe, it, expect } from 'vitest'
import {
  PLAYER_PHRASES,
  DEFAULT_PHRASES,
  getClassPhrases,
} from './phrases.ts'
import { PLAYER_CLASSES } from './classes.ts'

describe('PLAYER_PHRASES', () => {
  it('покрывает все классы из реестра', () => {
    for (const cls of PLAYER_CLASSES) {
      expect(PLAYER_PHRASES[cls.id]).toBeDefined()
    }
    expect(Object.keys(PLAYER_PHRASES)).toHaveLength(PLAYER_CLASSES.length)
  })

  it('у каждого класса есть непустые наборы shake и release', () => {
    for (const cls of PLAYER_CLASSES) {
      const phrases = PLAYER_PHRASES[cls.id]
      expect(phrases.shake.length).toBeGreaterThan(0)
      expect(phrases.release.length).toBeGreaterThan(0)
    }
  })

  it('все реплики — непустые строки', () => {
    const all = [
      ...Object.values(PLAYER_PHRASES).flatMap((p) => [...p.shake, ...p.release]),
      ...DEFAULT_PHRASES.shake,
      ...DEFAULT_PHRASES.release,
    ]
    for (const phrase of all) {
      expect(typeof phrase).toBe('string')
      expect(phrase.trim().length).toBeGreaterThan(0)
    }
  })
})

describe('getClassPhrases', () => {
  it('возвращает набор выбранного класса', () => {
    expect(getClassPhrases('barbarian')).toBe(PLAYER_PHRASES.barbarian)
    expect(getClassPhrases('wizard')).toBe(PLAYER_PHRASES.wizard)
  })

  it('возвращает нейтральный набор, если класс не задан', () => {
    expect(getClassPhrases()).toBe(DEFAULT_PHRASES)
    expect(getClassPhrases(undefined)).toBe(DEFAULT_PHRASES)
  })
})
