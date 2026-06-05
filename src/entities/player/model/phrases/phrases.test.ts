import { describe, it, expect } from 'vitest'
import { getClassPhrases } from './index.ts'
import { PLAYER_PHRASES_RU, DEFAULT_PHRASES_RU } from './ru.ts'
import { PLAYER_PHRASES_EN, DEFAULT_PHRASES_EN } from './en.ts'
import { PLAYER_PHRASES_SR, DEFAULT_PHRASES_SR } from './sr.ts'
import { PLAYER_PHRASES_TT, DEFAULT_PHRASES_TT } from './tt.ts'
import { PLAYER_CLASSES } from '../classes.ts'

const SETS = [
  { lang: 'ru' as const, all: PLAYER_PHRASES_RU, fallback: DEFAULT_PHRASES_RU },
  { lang: 'en' as const, all: PLAYER_PHRASES_EN, fallback: DEFAULT_PHRASES_EN },
  { lang: 'sr' as const, all: PLAYER_PHRASES_SR, fallback: DEFAULT_PHRASES_SR },
  { lang: 'tt' as const, all: PLAYER_PHRASES_TT, fallback: DEFAULT_PHRASES_TT },
]

describe.each(SETS)('реплики ($lang)', ({ all, fallback }) => {
  it('покрывают все классы из реестра', () => {
    for (const cls of PLAYER_CLASSES) {
      expect(all[cls.id]).toBeDefined()
    }
    expect(Object.keys(all)).toHaveLength(PLAYER_CLASSES.length)
  })

  it('у каждого класса есть непустые наборы shake, release, epic, success и fail', () => {
    for (const cls of PLAYER_CLASSES) {
      const phrases = all[cls.id]
      expect(phrases.shake.length).toBeGreaterThan(0)
      expect(phrases.release.length).toBeGreaterThan(0)
      expect(phrases.epic.length).toBeGreaterThan(0)
      expect(phrases.success.length).toBeGreaterThan(0)
      expect(phrases.fail.length).toBeGreaterThan(0)
    }
  })

  it('все реплики — непустые строки', () => {
    const everything = [
      ...Object.values(all).flatMap((p) => [...p.shake, ...p.release, ...p.epic, ...p.success, ...p.fail]),
      ...fallback.shake,
      ...fallback.release,
      ...fallback.epic,
      ...fallback.success,
      ...fallback.fail,
    ]
    for (const phrase of everything) {
      expect(typeof phrase).toBe('string')
      expect(phrase.trim().length).toBeGreaterThan(0)
    }
  })
})

describe('getClassPhrases', () => {
  it('возвращает набор выбранного класса для указанного языка', () => {
    expect(getClassPhrases('barbarian', 'ru')).toBe(PLAYER_PHRASES_RU.barbarian)
    expect(getClassPhrases('wizard', 'en')).toBe(PLAYER_PHRASES_EN.wizard)
  })

  it('по умолчанию использует английский язык', () => {
    expect(getClassPhrases('barbarian')).toBe(PLAYER_PHRASES_EN.barbarian)
  })

  it('возвращает нейтральный набор, если класс не задан', () => {
    expect(getClassPhrases(undefined, 'ru')).toBe(DEFAULT_PHRASES_RU)
    expect(getClassPhrases(undefined, 'en')).toBe(DEFAULT_PHRASES_EN)
  })
})
