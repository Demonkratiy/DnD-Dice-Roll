/**
 * Русский словарь UI-строк.
 *
 * Этот объект — «источник истины» формы словаря: тип `Dictionary` выводится из
 * него (`typeof ru`), поэтому английский словарь обязан повторить ровно те же
 * ключи — TypeScript не даст забыть ни одной строки при добавлении языка.
 *
 * Здесь только короткие строки интерфейса. Эмоциональные реплики персонажа по
 * классам живут отдельно — в доменном слое `entities/player/model/phrases`.
 */
export const ru = {
  /** Переключатель языка в настройках. */
  language: {
    label: 'Язык',
  },
  settings: {
    title: 'Настройки',
    ariaLabel: 'Настройки',
    close: 'Закрыть',
    theme: 'Тема',
    themeAria: 'Тема оформления',
    color: 'Цвет',
    colorAria: 'Цветовая палитра',
    showLogs: 'Показывать логи бросков',
    disableAnimations: 'Отключить анимации',
    open: 'Настройки',
  },
  character: {
    title: 'Герой',
    ariaLabel: 'Редактирование героя',
    close: 'Закрыть',
    edit: 'Редактировать героя',
    nameLabel: 'Имя',
    namePlaceholder: 'Имя героя',
    classLabel: 'Класс',
    classAria: 'Класс героя',
    noClass: 'Без класса',
  },
  stage: {
    sceneAria: 'Сцена броска',
    trayAria: 'Бросить кубики: тап — бросок, зажать и потрясти — эффектный бросок',
    resultLabel: 'Результат:',
    hint: 'Нажми кубик, чтобы бросить · зажми и потряси',
  },
  dicePicker: {
    groupAria: 'Выбор кубика',
  },
  rollControls: {
    count: 'Кубики',
    modifier: 'Модификатор',
    modeAria: 'Режим броска',
    modeDisadvantage: 'Помеха',
    modeNormal: 'Обычный',
    modeAdvantage: 'Преим.',
  },
  log: {
    title: 'История бросков',
    handleLabel: 'История бросков',
    empty: 'Пока нет бросков. Брось кубик!',
    clear: 'Очистить',
  },
  /** Названия стилей оформления (ось «форма», id → имя). */
  themeNames: {
    flat: 'Плоский',
    neon: 'Неон',
  },
  /** Названия цветовых палитр (ось «цвет», id → имя). */
  colorNames: {
    arcane: 'Аркана',
    charm: 'Очарование',
    crimson: 'Багрянец',
    darkness: 'Тьма',
    ember: 'Пламя',
    frost: 'Лёд',
    nature: 'Природа',
    necrotic: 'Некромантия',
    radiant: 'Сияние',
    storm: 'Гроза',
  },
  /** Названия классов персонажа (id → отображаемое имя). */
  classNames: {
    barbarian: 'Варвар',
    bard: 'Бард',
    cleric: 'Жрец',
    druid: 'Друид',
    fighter: 'Воин',
    monk: 'Монах',
    paladin: 'Паладин',
    ranger: 'Следопыт',
    rogue: 'Плут',
    sorcerer: 'Чародей',
    warlock: 'Колдун',
    wizard: 'Волшебник',
  },
}
