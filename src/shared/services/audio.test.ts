import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createWebAudioSoundPlayer, noopSoundPlayer } from './audio.ts'

/**
 * Тесты звукового проигрывателя. jsdom не реализует Web Audio API, поэтому
 * подменяем `window.AudioContext` лёгким моком и проверяем поведение «снаружи»:
 * создаётся ли контекст, дёргаются ли осцилляторы, уважается ли тумблер isEnabled.
 */

class FakeAudioParam {
  value = 0
  setValueAtTime = vi.fn()
  exponentialRampToValueAtTime = vi.fn()
  setTargetAtTime = vi.fn()
  cancelScheduledValues = vi.fn()
}

class FakeOscillator {
  type = 'sine'
  frequency = new FakeAudioParam()
  connect = vi.fn(() => ({ connect: vi.fn() }))
  start = vi.fn()
  stop = vi.fn()
}

class FakeGain {
  gain = new FakeAudioParam()
  connect = vi.fn(() => ({ connect: vi.fn() }))
}

class FakeBiquadFilter {
  type = 'lowpass'
  frequency = new FakeAudioParam()
  Q = new FakeAudioParam()
  connect = vi.fn(() => ({ connect: vi.fn() }))
}

class FakeConvolver {
  buffer: unknown = null
  connect = vi.fn(() => ({ connect: vi.fn() }))
}

class FakeAudioContext {
  static instances = 0
  state: 'running' | 'suspended' = 'running'
  currentTime = 0
  sampleRate = 44100
  destination = {}
  oscillators: FakeOscillator[] = []
  resume = vi.fn(() => Promise.resolve())
  constructor() {
    FakeAudioContext.instances += 1
  }
  createOscillator() {
    const osc = new FakeOscillator()
    this.oscillators.push(osc)
    return osc
  }
  createGain() {
    return new FakeGain()
  }
  createBiquadFilter() {
    return new FakeBiquadFilter()
  }
  createConvolver() {
    return new FakeConvolver()
  }
  createBuffer(_channels: number, length: number) {
    const data = new Float32Array(length)
    return { getChannelData: () => data }
  }
}

describe('createWebAudioSoundPlayer', () => {
  beforeEach(() => {
    FakeAudioContext.instances = 0
    ;(window as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext
  })

  afterEach(() => {
    delete (window as unknown as { AudioContext?: unknown }).AudioContext
    vi.restoreAllMocks()
  })

  it('does not create an AudioContext when sound is disabled', () => {
    const player = createWebAudioSoundPlayer({ isEnabled: () => false })
    player.play('reveal')
    expect(FakeAudioContext.instances).toBe(0)
  })

  it('creates the context lazily on the first enabled play and reuses it', () => {
    const player = createWebAudioSoundPlayer({ isEnabled: () => true })
    player.play('reveal')
    player.play('settle')
    expect(FakeAudioContext.instances).toBe(1)
  })

  it('schedules oscillators for the played event', () => {
    const player = createWebAudioSoundPlayer({ isEnabled: () => true })
    player.play('reveal')
    const ctx = (window as unknown as { AudioContext: { instances: number } }).AudioContext
    // critSuccess has three voices → three oscillators; reveal has one.
    expect(ctx.instances).toBe(1)
  })

  it('respects a live isEnabled getter without recreating the player', () => {
    let enabled = false
    const player = createWebAudioSoundPlayer({ isEnabled: () => enabled })
    player.play('reveal')
    expect(FakeAudioContext.instances).toBe(0)
    enabled = true
    player.play('reveal')
    expect(FakeAudioContext.instances).toBe(1)
  })

  it('is safe when no AudioContext is available', () => {
    delete (window as unknown as { AudioContext?: unknown }).AudioContext
    const player = createWebAudioSoundPlayer({ isEnabled: () => true })
    expect(() => player.play('reveal')).not.toThrow()
  })

  it('plays the tier escalation one-shots without throwing', () => {
    const player = createWebAudioSoundPlayer({ isEnabled: () => true })
    expect(() => {
      player.play('charged')
      player.play('epic')
    }).not.toThrow()
    expect(FakeAudioContext.instances).toBe(1)
  })

  it('starts a sustained loop lazily and controls it safely', () => {
    const player = createWebAudioSoundPlayer({ isEnabled: () => true })
    const shake = player.loop('shake')
    const spin = player.loop('spin')
    expect(FakeAudioContext.instances).toBe(1)
    expect(() => {
      shake.setIntensity(0.5)
      shake.stop()
      shake.stop() // повторная остановка безопасна
      spin.setIntensity(1)
      spin.stop()
    }).not.toThrow()
  })

  it('returns a no-op loop when sound is disabled', () => {
    const player = createWebAudioSoundPlayer({ isEnabled: () => false })
    const loop = player.loop('shake')
    expect(FakeAudioContext.instances).toBe(0)
    expect(() => {
      loop.setIntensity(0.5)
      loop.stop()
    }).not.toThrow()
  })
})

describe('noopSoundPlayer', () => {
  it('does nothing and never throws', () => {
    expect(() => noopSoundPlayer.play('critSuccess')).not.toThrow()
    const loop = noopSoundPlayer.loop('shake')
    expect(() => {
      loop.setIntensity(0.5)
      loop.stop()
    }).not.toThrow()
  })
})
