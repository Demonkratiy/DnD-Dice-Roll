import { defineConfig, devices } from '@playwright/test'

/**
 * Минимальный Playwright-стенд под «геометрические» сценарии, которые jsdom
 * (среда Vitest) не умеет проверять: реальный layout, scroll-snap, координаты
 * клика. Юнит-тесты остаются в Vitest (быстро), e2e — только там, где нужен
 * настоящий браузерный рендеринг.
 *
 * Сознательно по минимуму: один браузер (Chromium), dev-сервер Vite поднимается
 * автоматически через webServer.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Серийно: гео-сценарии чувствительны к таймингу анимаций, а параллельная
  // нагрузка на CPU замедляет React-апдейты и делает их флаки. Тестов мало —
  // детерминизм важнее скорости.
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
