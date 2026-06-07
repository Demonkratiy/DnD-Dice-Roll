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

/** Идентификаторы одноразовых звуковых событий приложения. */
export type SoundEvent =
  | 'shakeStart'
  | 'charged'
  | 'epic'
  | 'settle'
  | 'reveal'
  | 'critSuccess'
  | 'critFail'
  | 'stepUp'
  | 'stepDown'
  | 'modeShift'

/**
 * Идентификаторы непрерывных (sustained) звуков, тянущихся во времени.
 * Оба — «монетный» перезвон в духе Coin Toss Сэцера (FF6): короткий звяк
 * монеты повторяется циклично с лёгким случайным разбросом высоты/громкости.
 * `shake` — горсть монет в ладони (частит и ярчает с интенсивностью),
 * `spin` — подброшенная горсть осыпается со звоном (редеет и спускается по тону).
 */
export type LoopEvent = 'shake' | 'spin'

/** Управление непрерывным звуком: модуляция интенсивностью и остановка. */
export interface SoundLoop {
  /** Установить нормализованную интенсивность 0..1 (громкость/яркость/темп). */
  setIntensity(value: number): void
  /** Плавно остановить и освободить узлы. */
  stop(): void
}

/** Проигрыватель звуков. */
export interface SoundPlayer {
  play(event: SoundEvent): void
  /** Запустить непрерывный звук; вернуть управляющий хэндл. */
  loop(event: LoopEvent): SoundLoop
  /**
   * Сыграть ноту по индексу из «кубичной» гаммы (0..6). Выбор кубика звучит
   * как нота: 7 номиналов = 7 нот (до-ре-ми-…), можно наиграть мелодию.
   */
  playNote(index: number): void
}

/** Тихий хэндл-заглушка для непрерывного звука. */
const noopSoundLoop: SoundLoop = {
  setIntensity: () => {
    /* намеренно ничего не делаем */
  },
  stop: () => {
    /* намеренно ничего не делаем */
  },
}

/** Заглушка: ничего не воспроизводит. Безопасный дефолт и инструмент для тестов. */
export const noopSoundPlayer: SoundPlayer = {
  play: () => {
    /* намеренно ничего не делаем */
  },
  loop: () => noopSoundLoop,
  playNote: () => {
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

/** Ограничить значение диапазоном 0..1. */
function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
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
  // Переход в «заряженный» тир — короткий восходящий «набор силы» (E4→B4):
  // тонкий намёк, что бросок крепчает. Подкреплён лёгкой искрой и ревербом.
  charged: [
    { type: 'triangle', freq: 329.63, gain: 0.08, duration: 0.18, attack: 0.005, reverb: 0.25, vary: 0 }, // E4
    { type: 'triangle', freq: 493.88, gain: 0.08, duration: 0.26, attack: 0.005, reverb: 0.3, vary: 0, delay: 0.08 }, // B4
    { type: 'sine', freq: 987.77, gain: 0.03, duration: 0.2, attack: 0.006, reverb: 0.35, vary: 0, delay: 0.08 }, // B5 искра
  ],
  // Переход в «эпический» тир — мощный «всплеск силы»: низкий удар-бас +
  // восходящее яркое трезвучие (A4→E5→A5) с долгим ревербом. Максимум драмы.
  epic: [
    { type: 'triangle', freq: 110, gain: 0.22, duration: 0.5, attack: 0.006, reverb: 0.3, vary: 0 }, // A2 удар
    { type: 'square', freq: 440, gain: 0.08, duration: 0.4, attack: 0.005, reverb: 0.35, vary: 0, delay: 0.04 }, // A4
    { type: 'square', freq: 659.25, gain: 0.08, duration: 0.45, attack: 0.005, reverb: 0.4, vary: 0, delay: 0.12 }, // E5
    { type: 'triangle', freq: 880, gain: 0.1, duration: 0.6, attack: 0.005, reverb: 0.45, vary: 0, delay: 0.2 }, // A5
    { type: 'sine', freq: 1760, gain: 0.04, duration: 0.7, attack: 0.006, reverb: 0.5, vary: 0, delay: 0.2 }, // A6 блик
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
  // Крит-успех — узнаваемая «Victory Fanfare» Нобуо Уэмацу (FF). Сохранён сам
  // мотив: трельный затакт «та-та-та-таа» на C5, затем фраза A♭4→B♭4 и
  // разрешение в полный C-мажор с басом и колоколом. Тембр — чистая «арфа»
  // (triangle + sine-обертоны, БЕЗ square): тот же тёплый звон, что у каскада
  // вращения, поэтому фанфара «прорастает» из него, а не звучит чужеродно.
  critSuccess: [
    // Затакт-трель: три коротких C5 (triangle-«голос» + октавный sine-«блик»
    // C6 + квинтовый обертон G6, чтобы начало звенело арфой, а не глохло).
    { type: 'triangle', freq: 523.25, gain: 0.14, duration: 0.11, attack: 0.004, reverb: 0.28, vary: 0 },
    { type: 'sine', freq: 1046.5, gain: 0.05, duration: 0.13, attack: 0.004, reverb: 0.32, vary: 0 },
    { type: 'sine', freq: 1567.98, gain: 0.02, duration: 0.12, attack: 0.004, reverb: 0.34, vary: 0 },
    { type: 'triangle', freq: 523.25, gain: 0.14, duration: 0.11, attack: 0.004, reverb: 0.28, vary: 0, delay: 0.13 },
    { type: 'sine', freq: 1046.5, gain: 0.05, duration: 0.13, attack: 0.004, reverb: 0.32, vary: 0, delay: 0.13 },
    { type: 'sine', freq: 1567.98, gain: 0.02, duration: 0.12, attack: 0.004, reverb: 0.34, vary: 0, delay: 0.13 },
    { type: 'triangle', freq: 523.25, gain: 0.14, duration: 0.11, attack: 0.004, reverb: 0.28, vary: 0, delay: 0.26 },
    { type: 'sine', freq: 1046.5, gain: 0.05, duration: 0.13, attack: 0.004, reverb: 0.32, vary: 0, delay: 0.26 },
    { type: 'sine', freq: 1567.98, gain: 0.02, duration: 0.12, attack: 0.004, reverb: 0.34, vary: 0, delay: 0.26 },
    // «Таа» — держим C5 (с октавным и квинтовым бликами для блеска).
    { type: 'triangle', freq: 523.25, gain: 0.15, duration: 0.3, attack: 0.004, reverb: 0.32, vary: 0, delay: 0.4 },
    { type: 'sine', freq: 1046.5, gain: 0.05, duration: 0.32, attack: 0.004, reverb: 0.36, vary: 0, delay: 0.4 },
    { type: 'sine', freq: 1567.98, gain: 0.02, duration: 0.3, attack: 0.004, reverb: 0.36, vary: 0, delay: 0.4 },
    // Вторая фраза: A♭4 → B♭4 (подъём к разрешению) — с октавными бликами сверху.
    { type: 'triangle', freq: 415.3, gain: 0.13, duration: 0.16, attack: 0.004, reverb: 0.3, vary: 0, delay: 0.74 },
    { type: 'sine', freq: 830.61, gain: 0.05, duration: 0.18, attack: 0.004, reverb: 0.34, vary: 0, delay: 0.74 },
    { type: 'triangle', freq: 466.16, gain: 0.13, duration: 0.16, attack: 0.004, reverb: 0.3, vary: 0, delay: 0.92 },
    { type: 'sine', freq: 932.33, gain: 0.05, duration: 0.18, attack: 0.004, reverb: 0.34, vary: 0, delay: 0.92 },
    // Разрешение: длинный C-мажор (C3 бас + C4 + аккорд C5-E5-G5) и колокол C6.
    { type: 'triangle', freq: 130.81, gain: 0.2, duration: 0.85, attack: 0.006, reverb: 0.3, vary: 0, delay: 1.1 }, // C3 бас
    { type: 'triangle', freq: 261.63, gain: 0.1, duration: 0.85, attack: 0.006, reverb: 0.35, vary: 0, delay: 1.1 }, // C4
    { type: 'triangle', freq: 523.25, gain: 0.11, duration: 0.85, attack: 0.006, reverb: 0.4, vary: 0, delay: 1.1 }, // C5
    { type: 'triangle', freq: 659.25, gain: 0.11, duration: 0.85, attack: 0.006, reverb: 0.4, vary: 0, delay: 1.1 }, // E5
    { type: 'triangle', freq: 783.99, gain: 0.09, duration: 0.85, attack: 0.006, reverb: 0.4, vary: 0, delay: 1.1 }, // G5
    { type: 'sine', freq: 1046.5, gain: 0.1, duration: 0.95, attack: 0.006, reverb: 0.45, vary: 0, delay: 1.1 }, // C6 колокол
  ],
  // Крит-провал — «благородное поражение» арфой в a-moll (относительный минор
  // к C-мажору успеха — тематичная пара). Тот же арфовый тембр, что у каскада
  // вращения, поэтому крит «дорастает» из него: нисходящее арпеджио E5→C5→A4
  // замедляется и оседает в гулкую низкую квинту A-E с басом — пусто и горько,
  // но без писка. Длинный реверб даёт «уходящее эхо» падения.
  critFail: [
    { type: 'triangle', freq: 659.25, gain: 0.12, duration: 0.3, attack: 0.005, reverb: 0.28, vary: 0 }, // E5
    { type: 'sine', freq: 1318.51, gain: 0.03, duration: 0.3, attack: 0.006, reverb: 0.3, vary: 0 }, // E6 призвук
    { type: 'triangle', freq: 523.25, gain: 0.12, duration: 0.32, attack: 0.005, reverb: 0.28, vary: 0, delay: 0.22 }, // C5
    { type: 'triangle', freq: 440, gain: 0.13, duration: 0.36, attack: 0.005, reverb: 0.3, vary: 0, delay: 0.46 }, // A4
    // Оседание: гулкая низкая квинта A-E + бас A2, долгий хвост.
    { type: 'triangle', freq: 220, gain: 0.16, duration: 0.85, attack: 0.006, reverb: 0.35, vary: 0, delay: 0.78 }, // A3
    { type: 'triangle', freq: 164.81, gain: 0.11, duration: 0.85, attack: 0.006, reverb: 0.35, vary: 0, delay: 0.78 }, // E3 (квинта)
    { type: 'sine', freq: 110, gain: 0.2, duration: 0.95, attack: 0.008, reverb: 0.3, vary: 0, delay: 0.78 }, // A2 бас
  ],
  // --- UI-«тактильность»: короткие тихие арфовые отклики на действия. Тот же
  // тёплый тембр (triangle + sine-октава, vary: 0), что у сцены, — интерфейс
  // звучит «в одном инструменте» с броском, но ненавязчиво (малый gain). ---
  // (Смена номинала кубика озвучивается не отсюда, а нотой гаммы — см. playNote.)
  // Шаг «+» (увеличение) — короткий высокий щелчок E5: движение вверх = выше тон.
  stepUp: [
    { type: 'triangle', freq: 659.25, gain: 0.07, duration: 0.13, attack: 0.003, reverb: 0.2, vary: 0 }, // E5
    { type: 'sine', freq: 1318.51, gain: 0.025, duration: 0.14, attack: 0.003, reverb: 0.24, vary: 0 }, // E6 блик
  ],
  // Шаг «−» (уменьшение) — тот же щелчок ниже (B4): вниз = ниже тон.
  stepDown: [
    { type: 'triangle', freq: 493.88, gain: 0.07, duration: 0.13, attack: 0.003, reverb: 0.2, vary: 0 }, // B4
    { type: 'sine', freq: 987.77, gain: 0.025, duration: 0.14, attack: 0.003, reverb: 0.24, vary: 0 }, // B5 блик
  ],
  // Смена режима d20 — быстрый восходящий «флик» из двух нот (E5→B5): лёгкий
  // намёк на перелистывание варианта в барабане.
  modeShift: [
    { type: 'triangle', freq: 659.25, gain: 0.07, duration: 0.14, attack: 0.003, reverb: 0.22, vary: 0 }, // E5
    { type: 'triangle', freq: 987.77, gain: 0.07, duration: 0.18, attack: 0.003, reverb: 0.26, vary: 0, delay: 0.06 }, // B5
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

  // Один «щипок» арфы: тёплый гармоничный тон (как в финальном аккорде
  // `reveal`) — основной triangle + мягкие октава и квинта-сверху (sine),
  // мгновенная атака и долгий звон с ревербом. В отличие от негармоничного
  // «звяка», гармоники дают музыкальную струну, а не «стеклянный» призвук.
  const HARP_PARTIALS: { ratio: number; gain: number; type: OscillatorType }[] = [
    { ratio: 1, gain: 1, type: 'triangle' },
    { ratio: 2, gain: 0.3, type: 'sine' }, // октава
    { ratio: 3, gain: 0.12, type: 'sine' }, // октава + квинта
  ]
  const playHarp = (
    audio: AudioContext,
    startAt: number,
    freq: number,
    gain: number,
    reverb: number,
    dur = 0.5,
  ) => {
    const cluster = audio.createGain()
    cluster.gain.value = 1
    cluster.connect(audio.destination)
    if (reverb > 0) {
      const send = audio.createGain()
      send.gain.value = reverb
      cluster.connect(send).connect(getReverbInput(audio))
    }
    for (const p of HARP_PARTIALS) {
      const osc = audio.createOscillator()
      osc.type = p.type
      osc.frequency.setValueAtTime(freq * p.ratio, startAt)
      const g = audio.createGain()
      g.gain.setValueAtTime(0.0001, startAt)
      g.gain.exponentialRampToValueAtTime(gain * p.gain, startAt + 0.005)
      g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur)
      osc.connect(g).connect(cluster)
      osc.start(startAt)
      osc.stop(startAt + dur + 0.02)
    }
  }

  // E-мажорная пентатоника на пару октав (тот же строй, что у `reveal`).
  // Высоту щипков квантуем по ней — перебор всегда «в ладу», без фальши и
  // без «булькающего» скольжения непрерывной частоты.
  const HARP_SCALE = [
    329.63, // E4
    369.99, // F#4
    415.3, // G#4
    493.88, // B4
    554.37, // C#5
    659.25, // E5
    739.99, // F#5
    830.61, // G#5
    987.77, // B5
    1108.73, // C#6
    1318.51, // E6
  ]

  // «Кубичная» гамма: 7 кубиков (d4…d100) = 7 нот восходящей C-мажорной гаммы
  // (до-ре-ми-фа-соль-ля-си). Выбор кубика играет свою ноту, и на ленте можно
  // «наиграть» мелодию. Высота растёт с номиналом — крупнее кубик = выше нота.
  const DIE_NOTES = [
    523.25, // C5  до   — d4
    587.33, // D5  ре   — d6
    659.25, // E5  ми   — d8
    698.46, // F5  фа   — d10
    783.99, // G5  соль — d12
    880.0, // A5  ля   — d20
    987.77, // B5  си   — d100
  ]

  // Растряска = мягкий арфовый перебор: щипок повторяется циклично, нота
  // выбирается из пентатоники (всегда «в ладу»), на каждом повторе чуть
  // случайно меняется громкость. Чем сильнее зажатие (setIntensity), тем выше
  // регистр перебора и чаще щипки (будто арфист разыгрывается перед броском).
  const startShakeLoop = (audio: AudioContext): SoundLoop => {
    let stopped = false
    let intensity = 0.05
    let timer: ReturnType<typeof setTimeout> | undefined

    const SPAN = 4 // ширина «окна» нот, по которому скачет перебор
    const tick = () => {
      if (stopped) return
      const v = clamp01(intensity)
      const t = audio.currentTime
      // Окно нот поднимается по шкале с интенсивностью; внутри окна — случайная.
      const base = Math.round(v * (HARP_SCALE.length - 1 - SPAN))
      const idx = base + Math.floor(Math.random() * (SPAN + 1))
      const freq = HARP_SCALE[idx]
      const gain = (0.05 + v * 0.06) * (0.85 + Math.random() * 0.3)
      playHarp(audio, t, freq, gain, 0.32, 0.5)
      // Интервал сжимается с интенсивностью: неспешно (~260 мс) → живо (~110 мс).
      const next = (260 - v * 150) * (0.8 + Math.random() * 0.4)
      timer = setTimeout(tick, next)
    }
    tick()

    return {
      setIntensity(value: number) {
        if (stopped) return
        intensity = clamp01(value)
      },
      stop() {
        if (stopped) return
        stopped = true
        if (timer != null) clearTimeout(timer)
        // Уже запущенные «звяки» догасают сами — обрывать их не нужно.
      },
    }
  }

  // Вращение/раскрутка = ниспадающий арфовый каскад (как глиссандо вниз в
  // финальном аккорде, только рассыпающееся): щипки идут сверху вниз по
  // пентатонике и редеют со временем — «оседают». Не зависит от интенсивности:
  // живёт от scramble до settle. На stop() прекращаем планировать новые щипки.
  const startSpinLoop = (audio: AudioContext): SoundLoop => {
    let stopped = false
    const startedAt = audio.currentTime
    let timer: ReturnType<typeof setTimeout> | undefined

    const FALL = 1.6 // время «осыпания», с
    const top = HARP_SCALE.length - 1
    const tick = () => {
      if (stopped) return
      const t = audio.currentTime
      const elapsed = t - startedAt
      const fade = Math.max(0, 1 - elapsed / FALL)
      // Индекс ноты спускается сверху вниз по шкале со временем (± лёгкий разброс).
      const idx = Math.max(
        0,
        Math.round(top - (elapsed / FALL) * top - Math.random() * 1.5),
      )
      const freq = HARP_SCALE[idx]
      const gain = (0.05 + fade * 0.06) * (0.85 + Math.random() * 0.3)
      playHarp(audio, t, freq, gain, 0.3, 0.45)
      // Каскад редеет: интервал растёт по мере осыпания.
      const next = (70 + elapsed * 80) * (0.8 + Math.random() * 0.4)
      timer = setTimeout(tick, next)
    }
    tick()

    return {
      setIntensity() {
        /* раскрутка не зависит от интенсивности — осыпается по своему таймеру */
      },
      stop() {
        if (stopped) return
        stopped = true
        if (timer != null) clearTimeout(timer)
      },
    }
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
    loop(event: LoopEvent): SoundLoop {
      if (!deps.isEnabled()) return noopSoundLoop
      const audio = ensureContext()
      if (!audio) return noopSoundLoop
      if (audio.state === 'suspended') {
        void audio.resume()
      }
      return event === 'shake' ? startShakeLoop(audio) : startSpinLoop(audio)
    },
    playNote(index: number) {
      if (!deps.isEnabled()) return
      const audio = ensureContext()
      if (!audio) return
      if (audio.state === 'suspended') {
        void audio.resume()
      }
      // Индекс вне диапазона мягко зажимаем в гамму — звук всегда «в ладу».
      const i = Math.min(DIE_NOTES.length - 1, Math.max(0, Math.round(index)))
      // Чуть длиннее и звонче обычного UI-щипка — нота должна «петь».
      playHarp(audio, audio.currentTime, DIE_NOTES[i], 0.12, 0.3, 0.6)
    },
  }
}
