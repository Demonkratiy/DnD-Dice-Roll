/**
 * SoundPlayer — абстракция звукового сопровождения броска.
 *
 * Звуки генерируются процедурно через Web Audio API (никаких файлов-ассетов):
 * короткие осцилляторы + огибающая громкости дают «тук» приземления, «дзынь»
 * подтверждения и фанфару/зловещий аккорд крита — в духе плоского минимализма.
 *
 * Ключевые точки анимации (старт тряски, фиксация, показ результата, крит)
 * вызывают `play(event)`. Реальный проигрыватель — `createWebAudioSoundPlayer`;
 * `noopSoundPlayer` остаётся тихой заглушкой для тестов и как безопасный дефолт.
 */

/** Идентификаторы звуковых событий приложения. */
export type SoundEvent =
  | 'shakeStart'
  | 'settle'
  | 'reveal'
  | 'critSuccess'
  | 'critFail'

/** Проигрыватель звуков. */
export interface SoundPlayer {
  play(event: SoundEvent): void
}

/** Заглушка: ничего не воспроизводит. Безопасный дефолт и инструмент для тестов. */
export const noopSoundPlayer: SoundPlayer = {
  play: () => {
    /* намеренно ничего не делаем */
  },
}

/** Зависимости веб-аудио-проигрывателя (инъектируются ради тестируемости). */
export interface WebAudioSoundPlayerDeps {
  /**
   * Живой геттер «звук включён». Читается на КАЖДОМ `play()`, поэтому тумблер
   * настроек действует мгновенно, без пересоздания проигрывателя.
   */
  isEnabled: () => boolean
}

/** Минимальный конструктор AudioContext (с вендорным префиксом WebKit). */
type AudioContextCtor = typeof AudioContext

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    AudioContext?: AudioContextCtor
    webkitAudioContext?: AudioContextCtor
  }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

/** Небольшая вариация высоты тона, чтобы повторы не звучали «роботом». */
function vary(value: number, ratio = 0.04): number {
  return value * (1 + (Math.random() * 2 - 1) * ratio)
}

/**
 * Синтезированный импульсный отклик для реверба (ConvolverNode): затухающий
 * шум. Без файлов-ассетов — двухканальный «хвост зала» лепим прямо в памяти.
 * `decay` регулирует крутизну спада (больше = короче хвост).
 */
function makeImpulseResponse(audio: AudioContext, seconds: number, decay: number): AudioBuffer {
  const rate = audio.sampleRate
  const length = Math.max(1, Math.floor(rate * seconds))
  const buffer = audio.createBuffer(2, length, rate)
  for (let ch = 0; ch < 2; ch += 1) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < length; i += 1) {
      const t = i / length
      data[i] = (Math.random() * 2 - 1) * (1 - t) ** decay
    }
  }
  return buffer
}

/**
 * Описание одного «голоса» синтезируемого звука: волна, частотная огибающая
 * (from→to за время) и громкость. Несколько голосов складываются в событие.
 */
interface Voice {
  type: OscillatorType
  freq: number
  /** Конечная частота (для скольжения тона); если не задана — без скольжения. */
  freqTo?: number
  /** Пиковая громкость голоса (0..1). */
  gain: number
  /** Длительность звучания, с. */
  duration: number
  /** Задержка старта от момента события, с. */
  delay?: number
  /**
   * Доля случайного разброса высоты тона (по умолчанию 0.04). Для
   * музыкальных арпеджио ставим 0: chiptune держится на точном строе,
   * иначе ноты «плывут» и звучат фальшиво.
   */
  vary?: number
  /**
   * Время атаки (с) — за сколько громкость доходит до пика. По умолчанию
   * 0.01. Очень малое значение + длинный spad = «щипок» арфы/колокольчика.
   */
  attack?: number
  /**
   * Доля отправки в реверб-шину (0..1). По умолчанию 0 (сухо). Даёт
   * «хвост зала» — фирменное ощущение оркестровых саундтреков (FF/SNES).
   */
  reverb?: number
}

/**
 * Партитуры событий: набор голосов на каждое. Чистые данные — легко править.
 *
 * Единый стиль — Final Fantasy VI (Нобуо Уэмацу): тёплые треугольные/
 * синусоидальные «щипки» арфы и колокольчика с мгновенной атакой и хвостом
 * реверба, музыкальный строй (vary: 0). Оркестровое, а не «пищащее» ощущение.
 */
const VOICES: Record<SoundEvent, Voice[]> = {
  // Начало зажатия — восходящий арфовый «грейс-нот»: два быстрых щипка вверх
  // по квинте (A3→E4) с лёгким хвостом реверба и тихой искрой-обертоном сверху.
  // «Замах перед заклинанием»: движение вверх создаёт предвкушение броска.
  shakeStart: [
    { type: 'triangle', freq: 220, gain: 0.1, duration: 0.16, attack: 0.005, reverb: 0.2, vary: 0 }, // A3
    { type: 'triangle', freq: 329.63, gain: 0.1, duration: 0.24, attack: 0.005, reverb: 0.25, vary: 0, delay: 0.07 }, // E4
    { type: 'sine', freq: 659.25, gain: 0.03, duration: 0.2, attack: 0.006, reverb: 0.3, vary: 0, delay: 0.07 }, // E5 искра
  ],
  // Приземление — мягкий «арфовый» удар вместо сухого тука: низкая нота
  // с быстрым спадом частоты (удар) + тёплая квинта сверху и лёгкий реверб.
  settle: [
    { type: 'triangle', freq: 220, freqTo: 110, gain: 0.3, duration: 0.18, attack: 0.004, reverb: 0.15, vary: 0 }, // A3→A2
    { type: 'sine', freq: 329.63, gain: 0.08, duration: 0.16, attack: 0.004, reverb: 0.2, vary: 0 }, // E4 обертон
  ],
  // Показ результата — стилизация под Final Fantasy VI (Нобуо Уэмацу): быстрое
  // арфовое глиссандо вверх по E-мажорной пентатонике (треугольные «щипки»
  // с мгновенной атакой и долгим звоном), венчаемое «колокольным бликом»
  // (чистая нота + тихий высокий обертон). Всё уходит в реверб-хвост —
  // «магия/лечение» в духе заклинаний из FF. Точный строй (vary: 0).
  reveal: [
    { type: 'triangle', freq: 329.63, gain: 0.09, duration: 0.5, attack: 0.004, reverb: 0.3, vary: 0 }, // E4
    { type: 'triangle', freq: 415.3, gain: 0.09, duration: 0.5, attack: 0.004, reverb: 0.3, vary: 0, delay: 0.04 }, // G#4
    { type: 'triangle', freq: 493.88, gain: 0.09, duration: 0.5, attack: 0.004, reverb: 0.3, vary: 0, delay: 0.08 }, // B4
    { type: 'triangle', freq: 554.37, gain: 0.09, duration: 0.5, attack: 0.004, reverb: 0.3, vary: 0, delay: 0.12 }, // C#5
    { type: 'triangle', freq: 659.25, gain: 0.09, duration: 0.5, attack: 0.004, reverb: 0.3, vary: 0, delay: 0.16 }, // E5
    { type: 'triangle', freq: 830.61, gain: 0.09, duration: 0.5, attack: 0.004, reverb: 0.3, vary: 0, delay: 0.2 }, // G#5
    { type: 'triangle', freq: 987.77, gain: 0.1, duration: 0.6, attack: 0.004, reverb: 0.35, vary: 0, delay: 0.24 }, // B5
    // Колокольчик-«блик» на вершине: чистая E6 + тихий обертон B6, долгий хвост.
    { type: 'sine', freq: 1318.51, gain: 0.12, duration: 0.9, attack: 0.005, reverb: 0.45, vary: 0, delay: 0.28 }, // E6
    { type: 'sine', freq: 1975.53, gain: 0.04, duration: 0.7, attack: 0.005, reverb: 0.45, vary: 0, delay: 0.28 }, // B6
  ],
  // Крит-успех — мини «Victory Fanfare» в духе FF: фирменный ритм «та-та-та-
  // таа» (три короткие ноты + длинная разрешающая). Яркий «медный» square-lead
  // дублируется тёплым triangle на октаву ниже; на разрешении — полный
  // C-мажорный аккорд с басом и щедрым ревербом — торжество.
  critSuccess: [
    // Затакт: три короткие «медные» ноты G5 (lead + октавный дубль).
    { type: 'square', freq: 783.99, gain: 0.1, duration: 0.1, attack: 0.005, reverb: 0.25, vary: 0 },
    { type: 'triangle', freq: 392, gain: 0.12, duration: 0.1, attack: 0.005, reverb: 0.2, vary: 0 },
    { type: 'square', freq: 783.99, gain: 0.1, duration: 0.1, attack: 0.005, reverb: 0.25, vary: 0, delay: 0.13 },
    { type: 'triangle', freq: 392, gain: 0.12, duration: 0.1, attack: 0.005, reverb: 0.2, vary: 0, delay: 0.13 },
    { type: 'square', freq: 783.99, gain: 0.1, duration: 0.1, attack: 0.005, reverb: 0.25, vary: 0, delay: 0.26 },
    { type: 'triangle', freq: 392, gain: 0.12, duration: 0.1, attack: 0.005, reverb: 0.2, vary: 0, delay: 0.26 },
    // Разрешение: длинный C-мажорный аккорд (C-E-G-C) + бас C3.
    { type: 'triangle', freq: 130.81, gain: 0.2, duration: 0.7, attack: 0.006, reverb: 0.3, vary: 0, delay: 0.4 }, // C3 бас
    { type: 'square', freq: 523.25, gain: 0.1, duration: 0.7, attack: 0.006, reverb: 0.4, vary: 0, delay: 0.4 }, // C5
    { type: 'triangle', freq: 659.25, gain: 0.11, duration: 0.7, attack: 0.006, reverb: 0.4, vary: 0, delay: 0.4 }, // E5
    { type: 'square', freq: 783.99, gain: 0.1, duration: 0.7, attack: 0.006, reverb: 0.4, vary: 0, delay: 0.4 }, // G5
    { type: 'sine', freq: 1046.5, gain: 0.1, duration: 0.8, attack: 0.006, reverb: 0.45, vary: 0, delay: 0.4 }, // C6 колокол
  ],
  // Крит-провал — «трагический» нисходящий минорный мотив в духе FF
  // (поражение/game over): две «виолончельные» ноты (triangle) вниз по
  // минорному трезвучию + низкий бас и реверб — зловеще, но благородно.
  critFail: [
    { type: 'triangle', freq: 311.13, gain: 0.16, duration: 0.32, attack: 0.006, reverb: 0.25, vary: 0 }, // D#4
    { type: 'triangle', freq: 261.63, gain: 0.16, duration: 0.34, attack: 0.006, reverb: 0.25, vary: 0, delay: 0.18 }, // C4
    { type: 'triangle', freq: 207.65, gain: 0.18, duration: 0.6, attack: 0.006, reverb: 0.35, vary: 0, delay: 0.36 }, // G#3 (разрешение)
    { type: 'sine', freq: 103.83, gain: 0.2, duration: 0.7, attack: 0.008, reverb: 0.3, vary: 0, delay: 0.36 }, // G#2 бас
  ],
}

/**
 * Веб-аудио-проигрыватель. `AudioContext` создаётся ЛЕНИВО на первом `play()` —
 * это происходит в ответ на жест пользователя (тап/зажатие), поэтому autoplay-
 * политика браузера не блокирует звук. Если звук выключен в настройках, контекст
 * не создаётся вовсе.
 */
export function createWebAudioSoundPlayer(deps: WebAudioSoundPlayerDeps): SoundPlayer {
  let ctx: AudioContext | null = null
  // Реверб-шина (input → convolver → destination) — создаётся лениво на
  // первом «мокром» голосе и переиспользуется.
  let reverbInput: GainNode | null = null

  const ensureContext = (): AudioContext | null => {
    if (ctx) return ctx
    const Ctor = getAudioContextCtor()
    if (!Ctor) return null
    try {
      ctx = new Ctor()
    } catch {
      return null
    }
    return ctx
  }

  const getReverbInput = (audio: AudioContext): GainNode => {
    if (reverbInput) return reverbInput
    const convolver = audio.createConvolver()
    convolver.buffer = makeImpulseResponse(audio, 1.4, 2.6)
    const input = audio.createGain()
    input.connect(convolver).connect(audio.destination)
    reverbInput = input
    return reverbInput
  }

  const playVoice = (audio: AudioContext, voice: Voice, startAt: number) => {
    const osc = audio.createOscillator()
    const gainNode = audio.createGain()
    const t0 = startAt + (voice.delay ?? 0)
    const t1 = t0 + voice.duration

    osc.type = voice.type
    const f0 = vary(voice.freq, voice.vary)
    osc.frequency.setValueAtTime(f0, t0)
    if (voice.freqTo != null) {
      // exponentialRamp требует строго положительных значений — частоты у нас > 0.
      osc.frequency.exponentialRampToValueAtTime(vary(voice.freqTo, voice.vary), t1)
    }

    // Огибающая: быстрая (настраиваемая) атака, экспоненциальный спад до тишины.
    const attack = voice.attack ?? 0.01
    gainNode.gain.setValueAtTime(0.0001, t0)
    gainNode.gain.exponentialRampToValueAtTime(voice.gain, t0 + attack)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t1)

    // Сухой сигнал всегда идёт на выход; при reverb > 0 копию шлём в реверб-шину.
    osc.connect(gainNode)
    gainNode.connect(audio.destination)
    if (voice.reverb) {
      const send = audio.createGain()
      send.gain.value = voice.reverb
      gainNode.connect(send).connect(getReverbInput(audio))
    }
    osc.start(t0)
    osc.stop(t1 + 0.02)
  }

  return {
    play(event: SoundEvent) {
      if (!deps.isEnabled()) return
      const audio = ensureContext()
      if (!audio) return
      // Контекст мог «уснуть» (смена вкладки/политика) — будим его.
      if (audio.state === 'suspended') {
        void audio.resume()
      }
      const startAt = audio.currentTime
      for (const voice of VOICES[event]) {
        playVoice(audio, voice, startAt)
      }
    },
  }
}
