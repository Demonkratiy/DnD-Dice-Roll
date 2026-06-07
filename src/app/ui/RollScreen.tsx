/**
 * RollScreen — главный экран приложения. App-слой композирует фичи и состояние.
 *
 * Сверху вниз: верхняя строка (игрок · настройки) → Сцена броска → лента выбора
 * кубика → настройки броска → (опц.) выезжающая панель логов с хэндлом-пером.
 */

import { useMemo, useRef, useState } from 'react'
import { IconButton } from '@shared/ui'
import { createLocalRollSource, createWebAudioSoundPlayer } from '@shared/services'
import { useReducedMotion, createLoadedRng, type LoadedRollMode } from '@shared/lib'
import { useT } from '@shared/locale'
import { createLocalPlayer, ClassIcon } from '@entities/player'
import { DIE_TYPES, type DieType } from '@entities/die'
import type { RollMode, RollRequest, RollResult } from '@entities/roll'
import { Stage } from '@features/stage'
import { DicePicker } from '@features/dice-picker'
import { RollControls } from '@features/roll-controls'
import { SettingsPanel } from '@features/settings'
import { CharacterEditor } from '@features/character'
import { LogDrawer } from '@features/log'
import { useRollLog, useSettings, useCharacter } from '../providers'
import styles from './RollScreen.module.css'

export function RollScreen() {
  const character = useCharacter()
  const t = useT()
  const player = useMemo(
    () => createLocalPlayer(character.name, character.classId),
    [character.name, character.classId],
  )
  // DEV-only «форс-бросок»: в dev-сборке можно заставить кубик всегда давать
  // максимум/минимум (для теста крит-эффектов). Реализовано через подмену
  // RNG на шве RollSource — домен и крит-логика остаются чистыми. Контрол
  // виден только в DEV (см. SettingsPanel), в проде состояние всегда 'off'.
  const [forceRoll, setForceRoll] = useState<LoadedRollMode | 'off'>('off')
  const rollSource = useMemo(
    () =>
      createLocalRollSource({
        getAuthor: () => player,
        rng: forceRoll === 'off' ? undefined : createLoadedRng(forceRoll),
      }),
    [player, forceRoll],
  )

  const { entries, addRoll, clearLog } = useRollLog()
  const settings = useSettings()
  const systemReducedMotion = useReducedMotion()
  const reducedMotion = systemReducedMotion || settings.disableAnimations

  // Звуковой проигрыватель. Создаётся ОДИН раз за жизнь экрана — иначе каждое
  // переключение тумблера плодило бы новый AudioContext (старые не закрываются,
  // у браузера лимит ~6 живых контекстов), отчего звук «затихал» с каждым разом.
  // Актуальное состояние тумблера читаем через ref, чтобы геттер `isEnabled`
  // не «застывал» на значении момента создания.
  const soundEnabledRef = useRef(settings.soundEnabled)
  soundEnabledRef.current = settings.soundEnabled
  const soundPlayer = useMemo(
    () => createWebAudioSoundPlayer({ isEnabled: () => soundEnabledRef.current }),
    [],
  )

  const [die, setDie] = useState<DieType>('d20')
  const [count, setCount] = useState(1)
  const [modifier, setModifier] = useState(0)
  const [mode, setMode] = useState<RollMode>('normal')

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [characterOpen, setCharacterOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)

  const request: RollRequest = useMemo(
    () => ({ die, count, modifier, mode }),
    [die, count, modifier, mode],
  )

  const handleDieChange = (next: DieType) => {
    // Каждый номинал — это, как правило, отдельная проверка со своими условиями:
    // у одного броска своё количество костей и свой модификатор, которые почти
    // наверняка не подходят следующему. Поэтому при ЛЮБОЙ смене кубика сбрасываем
    // черновик броска к дефолтам (1 кость, без модификатора, обычный режим), а не
    // переносим старые значения на другой кубик.
    if (next !== die) {
      setCount(1)
      setModifier(0)
      setMode('normal')
    }
    setDie(next)
    // 7 кубиков = 7 нот: выбор номинала играет свою ноту C-мажорной гаммы
    // (до-ре-ми-…). Ноту даём на КАЖДЫЙ клик (даже по тому же кубику), чтобы
    // по ленте можно было «наиграть» мелодию с повторами.
    soundPlayer.playNote(DIE_TYPES.indexOf(next))
  }

  const handleResult = (result: RollResult) => addRoll(result)

  // Озвученные открытие/закрытие модалок: звук + смена флага видимости. Звук
  // вешаем здесь (а не в самих фичах), чтобы общие компоненты оставались чистыми.
  const openSettings = () => {
    soundPlayer.play('panelOpen')
    setSettingsOpen(true)
  }
  const closeSettings = () => {
    soundPlayer.play('panelClose')
    setSettingsOpen(false)
  }
  const openCharacter = () => {
    soundPlayer.play('panelOpen')
    setCharacterOpen(true)
  }
  const closeCharacter = () => {
    soundPlayer.play('panelClose')
    setCharacterOpen(false)
  }
  const handleLogOpenChange = (next: boolean) => {
    soundPlayer.play(next ? 'panelOpen' : 'panelClose')
    setLogOpen(next)
  }
  const handleClearLog = () => {
    soundPlayer.play('clearLog')
    clearLog()
  }

  return (
    <div className={styles.screen}>
      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.player}
          onClick={openCharacter}
          aria-label={t.character.edit}
        >
          {/* Маркер перед именем: если выбран класс — его иконка, иначе аморфная
           * руна. Оба окрашены акцентом палитры и светятся тем же ореолом, что и
           * кубик, — связывают шапку с темой и главным объектом сцены. «Дышат» в
           * такт сцене; при reduced-motion дыхание гасим. */}
          {player.classId ? (
            <ClassIcon
              classId={player.classId}
              size={28}
              className={`${styles.classIcon} ${reducedMotion ? styles.runeStill : ''}`}
            />
          ) : (
            <span
              className={`${styles.rune} ${reducedMotion ? styles.runeStill : ''}`}
              aria-hidden="true"
            />
          )}
          <span className={styles.playerName}>{player.name}</span>
        </button>
        <IconButton label={t.settings.open} onClick={openSettings}>
          ⚙
        </IconButton>
      </header>

      <main className={styles.main}>
        <Stage
          request={request}
          rollSource={rollSource}
          reducedMotion={reducedMotion}
          onResult={handleResult}
          classId={player.classId}
          soundPlayer={soundPlayer}
        />
        <DicePicker value={die} onChange={handleDieChange} />
        <RollControls
          die={die}
          count={count}
          modifier={modifier}
          mode={mode}
          onCountChange={setCount}
          onModifierChange={setModifier}
          onModeChange={setMode}
          soundPlayer={soundPlayer}
        />
      </main>

      <SettingsPanel
        open={settingsOpen}
        onClose={closeSettings}
        showLogs={settings.showLogs}
        onShowLogsChange={settings.setShowLogs}
        disableAnimations={settings.disableAnimations}
        onDisableAnimationsChange={settings.setDisableAnimations}
        soundEnabled={settings.soundEnabled}
        onSoundEnabledChange={settings.setSoundEnabled}
        forceRoll={forceRoll}
        onForceRollChange={setForceRoll}
        soundPlayer={soundPlayer}
      />

      <CharacterEditor
        open={characterOpen}
        onClose={closeCharacter}
        name={character.name}
        onNameChange={character.setName}
        classId={character.classId}
        onClassChange={character.setClassId}
        soundPlayer={soundPlayer}
      />

      {settings.showLogs && (
        <LogDrawer
          entries={entries}
          open={logOpen}
          onOpenChange={handleLogOpenChange}
          onClear={handleClearLog}
        />
      )}
    </div>
  )
}
