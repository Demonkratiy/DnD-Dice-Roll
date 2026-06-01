/**
 * Сербский словарь UI-строк (латиница).
 *
 * Повторяет ровно те же ключи, что и `ru` (источник типа `Dictionary`) — TS не
 * даст забыть ни одной строки. Названия классов даны в сербской традиции D&D
 * (sorcerer/warlock/wizard различаются: Vrač / Veštac / Mag).
 */
import type { Dictionary } from './dictionary.ts'

export const sr: Dictionary = {
  language: {
    label: 'Jezik',
  },
  settings: {
    title: 'Podešavanja',
    ariaLabel: 'Podešavanja',
    close: 'Zatvori',
    theme: 'Tema',
    themeAria: 'Tema izgleda',
    color: 'Boja',
    colorAria: 'Paleta boja',
    showLogs: 'Prikaži istoriju bacanja',
    disableAnimations: 'Isključi animacije',
    open: 'Podešavanja',
  },
  character: {
    title: 'Junak',
    ariaLabel: 'Uređivanje junaka',
    close: 'Zatvori',
    edit: 'Uredi junaka',
    nameLabel: 'Ime',
    namePlaceholder: 'Ime junaka',
    classLabel: 'Klasa',
    classAria: 'Klasa junaka',
    noClass: 'Bez klase',
  },
  stage: {
    sceneAria: 'Scena bacanja',
    trayAria: 'Baci kockice: tap — bacanje, drži i protresi — efektno bacanje',
    resultLabel: 'Rezultat:',
    hint: 'Pritisni kockicu da baciš · drži i protresi',
  },
  dicePicker: {
    groupAria: 'Izbor kockice',
  },
  rollControls: {
    count: 'Kockice',
    modifier: 'Modifikator',
    modeAria: 'Režim bacanja',
    modeDisadvantage: 'Mana',
    modeNormal: 'Običan',
    modeAdvantage: 'Pred.',
  },
  log: {
    title: 'Istorija bacanja',
    handleLabel: 'Istorija bacanja',
    empty: 'Još nema bacanja. Baci kockicu!',
    clear: 'Obriši',
  },
  themeNames: {
    flat: 'Ravni',
    neon: 'Neon',
  },
  colorNames: {
    arcane: 'Arkana',
    charm: 'Čar',
    crimson: 'Grimiz',
    darkness: 'Tama',
    ember: 'Žar',
    frost: 'Mraz',
    nature: 'Priroda',
    necrotic: 'Nekroza',
    radiant: 'Sjaj',
    storm: 'Oluja',
  },
  classNames: {
    barbarian: 'Varvarin',
    bard: 'Bard',
    cleric: 'Sveštenik',
    druid: 'Druid',
    fighter: 'Borac',
    monk: 'Monah',
    paladin: 'Paladin',
    ranger: 'Lovac',
    rogue: 'Lopov',
    sorcerer: 'Vrač',
    warlock: 'Veštac',
    wizard: 'Mag',
  },
}
