/**
 * Единый флаг доступности dev-инструментов (force-roll и т.п.).
 *
 * Включён только в «настоящем» dev-режиме (`npm run dev`). В прод-сборке его
 * нет (`import.meta.env.DEV === false`), а в режиме «prod-view»
 * (`npm run dev:prodview`, Vite `--mode prodview` → `.env.prodview`) он
 * принудительно выключается флагом `VITE_PROD_VIEW`. Так можно крутить
 * приложение на dev-сервере, но видеть его ровно как в продакшене.
 */
export const DEV_TOOLS_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_PROD_VIEW !== 'true'
