/**
 * Татарский словарь UI-строк (кириллица, Татарстан).
 *
 * Повторяет ровно те же ключи, что и `ru` (источник типа `Dictionary`) — TS не
 * даст забыть ни одной строки. Названия классов даны в привычной для татарского
 * фэнтези-традиции; различаем sorcerer/warlock/wizard (Фәсүнче / Мәлгүн / Тылсымчы).
 */
import type { Dictionary } from './dictionary.ts'

export const tt: Dictionary = {
  language: {
    label: 'Тел',
  },
  settings: {
    title: 'Көйләүләр',
    ariaLabel: 'Көйләүләр',
    close: 'Ябу',
    theme: 'Тема',
    themeAria: 'Бизәлеш темасы',
    color: 'Төс',
    colorAria: 'Төсләр палитрасы',
    showLogs: 'Ату тарихын күрсәтү',
    disableAnimations: 'Анимацияләрне сүндерү',
    sound: 'Тавыш',
    open: 'Көйләүләр',
  },
  character: {
    title: 'Каһарман',
    ariaLabel: 'Каһарманны үзгәртү',
    close: 'Ябу',
    edit: 'Каһарманны үзгәртү',
    nameLabel: 'Исем',
    namePlaceholder: 'Каһарман исеме',
    classLabel: 'Сыйныф',
    classAria: 'Каһарман классы',
    noClass: 'Сыйныфсыз',
  },
  stage: {
    sceneAria: 'Ату сәхнәсе',
    trayAria: 'Кубикларны ат: тап — ату, кысып селкет — тәэсирле ату',
    resultLabel: 'Нәтиҗә:',
    hint: 'Атыр өчен кубикка бас · кысып селкет',
  },
  dicePicker: {
    groupAria: 'Кубик сайлау',
  },
  rollControls: {
    count: 'Кубиклар',
    modifier: 'Модификатор',
    modeAria: 'Ату режимы',
    modeLabel: 'Режим',
    modeDisadvantage: 'Комачау',
    modeNormal: 'Гадәти',
    modeAdvantage: 'Өстен.',
    modeElven: 'Эльф төзлек',
    modeBeyond: '✦ Дөньялар артында ✦',
  },
  log: {
    title: 'Ату тарихы',
    handleLabel: 'Ату тарихы',
    empty: 'Әле атулар юк. Кубик ат!',
    clear: 'Чистарту',
  },
  themeNames: {
    flat: 'Яссы',
    neon: 'Неон',
  },
  colorNames: {
    arcane: 'Серле',
    charm: 'Ауру',
    crimson: 'Ал',
    darkness: 'Караңгылык',
    ember: 'Куз',
    frost: 'Суыклык',
    nature: 'Табигать',
    necrotic: 'Үлем',
    radiant: 'Балкыш',
    storm: 'Давыл',
  },
  classNames: {
    barbarian: 'Кыргый',
    bard: 'Җырау',
    cleric: 'Рухани',
    druid: 'Табигать сакчысы',
    fighter: 'Яугир',
    monk: 'Көрәшче',
    paladin: 'Батыр',
    ranger: 'Сукмакчы',
    rogue: 'Хәйләкәр',
    sorcerer: 'Фәсүнче',
    warlock: 'Мәлгүн',
    wizard: 'Тылсымчы',
  },
}
