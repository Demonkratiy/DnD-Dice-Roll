/**
 * Английский словарь UI-строк.
 *
 * Типизирован как `Dictionary`, поэтому обязан повторить все ключи русского
 * словаря — иначе ошибка компиляции. Сюда добавляем переводы UI; эмоциональные
 * реплики персонажа живут в `entities/player/model/phrases`.
 */

import type { Dictionary } from './dictionary.ts'

export const en: Dictionary = {
  language: {
    label: 'Language',
  },
  settings: {
    title: 'Settings',
    ariaLabel: 'Settings',
    close: 'Close',
    theme: 'Theme',
    themeAria: 'Visual theme',
    color: 'Color',
    colorAria: 'Color palette',
    showLogs: 'Show roll history',
    disableAnimations: 'Disable animations',
    open: 'Settings',
  },
  character: {
    title: 'Hero',
    ariaLabel: 'Edit hero',
    close: 'Close',
    edit: 'Edit hero',
    nameLabel: 'Name',
    namePlaceholder: 'Hero name',
    classLabel: 'Class',
    classAria: 'Hero class',
    noClass: 'No class',
  },
  stage: {
    sceneAria: 'Roll stage',
    trayAria: 'Roll the dice: tap to roll, press and shake for a flashy roll',
    resultLabel: 'Result:',
    hint: 'Tap the die to roll · press and shake',
  },
  dicePicker: {
    groupAria: 'Die selection',
  },
  rollControls: {
    count: 'Dice',
    modifier: 'Modifier',
    modeAria: 'Roll mode',
    modeDisadvantage: 'Disadv.',
    modeNormal: 'Normal',
    modeAdvantage: 'Adv.',
    modeElven: 'Elven acc.',
  },
  log: {
    title: 'Roll history',
    handleLabel: 'Roll history',
    empty: 'No rolls yet. Roll a die!',
    clear: 'Clear',
  },
  themeNames: {
    flat: 'Flat',
    neon: 'Neon',
  },
  colorNames: {
    arcane: 'Arcane',
    charm: 'Charm',
    crimson: 'Crimson',
    darkness: 'Darkness',
    ember: 'Ember',
    frost: 'Frost',
    nature: 'Nature',
    necrotic: 'Necrotic',
    radiant: 'Radiant',
    storm: 'Storm',
  },
  classNames: {
    barbarian: 'Barbarian',
    bard: 'Bard',
    cleric: 'Cleric',
    druid: 'Druid',
    fighter: 'Fighter',
    monk: 'Monk',
    paladin: 'Paladin',
    ranger: 'Ranger',
    rogue: 'Rogue',
    sorcerer: 'Sorcerer',
    warlock: 'Warlock',
    wizard: 'Wizard',
  },
}
