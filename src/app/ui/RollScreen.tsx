/**
 * RollScreen — главный экран приложения. App-слой композирует фичи и состояние.
 *
 * Сверху вниз: верхняя строка (игрок · настройки) → Сцена броска → лента выбора
 * кубика → настройки броска → (опц.) выезжающая панель логов с хэндлом-пером.
 */

import { useMemo, useState } from 'react'
import { IconButton } from '@shared/ui'
import { createLocalRollSource } from '@shared/services'
import { useReducedMotion } from '@shared/lib'
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
  const player = useMemo(
    () => createLocalPlayer(character.name, character.classId),
    [character.name, character.classId],
  )
  const rollSource = useMemo(
    () => createLocalRollSource({ getAuthor: () => player }),
    [player],
  )

  const { entries, addRoll, clearLog } = useRollLog()
  const settings = useSettings()
  const systemReducedMotion = useReducedMotion()
  const reducedMotion = systemReducedMotion || settings.disableAnimations

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
    setDie(next)
    // adv/dis осмыслен только для d20 — на других кубиках сбрасываем в обычный.
    if (next !== 'd20') {
      setMode('normal')
    }
  }

  const handleResult = (result: RollResult) => addRoll(result)

  return (
    <div className={styles.screen}>
      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.player}
          onClick={() => setCharacterOpen(true)}
          aria-label="Редактировать героя"
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
        <IconButton label="Настройки" onClick={() => setSettingsOpen(true)}>
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
