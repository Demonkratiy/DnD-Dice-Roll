/**
 * RollScreen — главный экран приложения. App-слой композирует фичи и состояние.
 *
 * Сверху вниз: верхняя строка (игрок · настройки) → Сцена броска → лента выбора
 * кубика → настройки броска → (опц.) выезжающая панель логов с хэндлом-пером.
 */

import { useMemo, useState } from 'react'
import { IconButton } from '@shared/ui'
import { createLocalRollSource, createWebAudioSoundPlayer } from '@shared/services'
import { useReducedMotion, createLoadedRng, type LoadedRollMode } from '@shared/lib'
import { useT } from '@shared/locale'
import { createLocalPlayer, ClassIcon } from '@entities/player'
import type { DieType } from '@entities/die'
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

  // Звуковой проигрыватель. Тумблер `soundEnabled` пробрасываем прямо в геттер;
  // при его смене useMemo пересоздаёт проигрыватель (переключения редки, по
  // умолчанию звук выключен), поэтому держать «живой» ref не требуется.
  const soundPlayer = useMemo(
    () => createWebAudioSoundPlayer({ isEnabled: () => settings.soundEnabled }),
    [settings.soundEnabled],
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
  }

  const handleResult = (result: RollResult) => addRoll(result)

  return (
    <div className={styles.screen}>
      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.player}
          onClick={() => setCharacterOpen(true)}
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
        <IconButton label={t.settings.open} onClick={() => setSettingsOpen(true)}>
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
        />
      </main>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        showLogs={settings.showLogs}
        onShowLogsChange={settings.setShowLogs}
        disableAnimations={settings.disableAnimations}
        onDisableAnimationsChange={settings.setDisableAnimations}
        soundEnabled={settings.soundEnabled}
        onSoundEnabledChange={settings.setSoundEnabled}
        forceRoll={forceRoll}
        onForceRollChange={setForceRoll}
      />

      <CharacterEditor
        open={characterOpen}
        onClose={() => setCharacterOpen(false)}
        name={character.name}
        onNameChange={character.setName}
        classId={character.classId}
        onClassChange={character.setClassId}
      />

      {settings.showLogs && (
        <LogDrawer
          entries={entries}
          open={logOpen}
          onOpenChange={setLogOpen}
          onClear={clearLog}
        />
      )}
    </div>
  )
}
