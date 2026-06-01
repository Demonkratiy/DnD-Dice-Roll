import { describe, it, expect } from 'vitest'
import { PLAYER_CLASSES, isPlayerClassId } from './classes.ts'
import { createLocalPlayer, LOCAL_PLAYER_ID } from './types.ts'

describe('PLAYER_CLASSES', () => {
  it('содержит полный набор из 12 классов D&D 5e', () => {
    expect(PLAYER_CLASSES).toHaveLength(12)
  })

  it('идентификаторы классов уникальны', () => {
    const ids = PLAYER_CLASSES.map((cls) => cls.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('у каждого класса есть непустое имя', () => {
    for (const cls of PLAYER_CLASSES) {
      expect(cls.name.trim().length).toBeGreaterThan(0)
    }
  })
})

describe('isPlayerClassId', () => {
  it('принимает существующие идентификаторы', () => {
    expect(isPlayerClassId('wizard')).toBe(true)
    expect(isPlayerClassId('barbarian')).toBe(true)
  })

  it('отклоняет неизвестные значения и не-строки', () => {
    expect(isPlayerClassId('paladinx')).toBe(false)
    expect(isPlayerClassId('')).toBe(false)
    expect(isPlayerClassId(undefined)).toBe(false)
    expect(isPlayerClassId(42)).toBe(false)
    expect(isPlayerClassId(null)).toBe(false)
  })
})

describe('createLocalPlayer', () => {
  it('создаёт игрока с дефолтным id и без класса по умолчанию', () => {
    const player = createLocalPlayer()
    expect(player.id).toBe(LOCAL_PLAYER_ID)
    expect(player.classId).toBeUndefined()
    expect(player.name.length).toBeGreaterThan(0)
  })

  it('принимает имя и класс', () => {
    const player = createLocalPlayer('Гэндальф', 'wizard')
    expect(player).toEqual({
      id: LOCAL_PLAYER_ID,
      name: 'Гэндальф',
      classId: 'wizard',
    })
  })

  it('остаётся сериализуемым (готов к передаче по сети)', () => {
    const player = createLocalPlayer('Конан', 'barbarian')
    expect(JSON.parse(JSON.stringify(player))).toEqual(player)
  })
})
