import { test, expect, type Page, type Locator } from '@playwright/test'

/**
 * E2E на WheelPicker — именно тот класс багов, который НЕ ловится в jsdom:
 * выбор пункта считается геометрически (смещение указателя от центра /
 * ITEM_HEIGHT), а на это влияют реальный layout, scroll-snap и CSS-переходы.
 * Плюс тач-жесты (тап против свайпа), которые порождают pointer-события с
 * pointerType='touch' и нативную инерцию скролла — в jsdom этого нет вовсе.
 *
 * Подписи берём английские: EN — дефолтный язык приложения, а локаль стенда
 * зафиксирована в playwright.config.ts (use.locale = 'en-US').
 */

const WHEEL = '[role="radiogroup"][aria-label="Roll mode"]'
const ITEM_HEIGHT = 40

function checkedLabel(wheel: Locator) {
  return wheel.locator('[role="radio"][aria-checked="true"]').innerText()
}

async function isOpen(wheel: Locator) {
  return (await wheel.getAttribute('data-open')) === 'true'
}

/** Центр корня барабана (его высота постоянна — barrel раскрывается абсолютно). */
async function center(wheel: Locator) {
  const box = await wheel.boundingBox()
  if (!box) throw new Error('WheelPicker не виден')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

/** Раскрывает барабан наведением и кликает по пункту со смещением offset от центра. */
async function clickOffset(page: Page, wheel: Locator, offsetItems: number) {
  // Центрируем барабан в окне: иначе на невысоком десктоп-вьюпорте он может
  // оказаться у нижней кромки, и клик на center+ITEM_HEIGHT уходит за край окна
  // (выбор не регистрируется). По центру гарантированно есть место под пунктами.
  await wheel.evaluate((el) => el.scrollIntoView({ block: 'center' }))
  // Уводим курсор в нейтральную точку, затем наводим на барабан: так указатель
  // гарантированно пересекает границу барабана и порождает свежий pointerenter
  // (повторный hover из точки прошлого клика его бы не дал — барабан не раскрылся бы).
  await page.mouse.move(0, 0)
  await wheel.hover()
  await page.waitForTimeout(350) // дождаться раскрытия окна (clip-path → 0)
  const c = await center(wheel)
  const clickY = c.y + offsetItems * ITEM_HEIGHT
  await page.mouse.move(c.x, clickY)
  await page.mouse.down()
  await page.mouse.up()
  // Даём барабану схлопнуться (закрытие ~0.45s) и React-стейту осесть.
  await page.waitForTimeout(550)
}

/** Приводит барабан в детерминированное состояние — верхний пункт (Disadv.). */
async function gotoTop(page: Page, wheel: Locator) {
  await wheel.focus()
  // Число шагов вверх берём из DOM (кол-во опций), а не из хардкода —
  // так тест не сломается при добавлении/удалении режимов.
  const optionCount = await wheel.getByRole('radio').count()
  for (let i = 0; i < optionCount; i++) {
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(60)
  }
  await page.mouse.click(5, 5) // увести фокус → барабан схлопывается
  await page.waitForTimeout(200)
  await expect.poll(() => checkedLabel(wheel)).toBe('Disadv.')
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.getByRole('radio', { name: 'd20' }).click()
  await expect(page.locator(WHEEL)).toBeVisible()
})

test('клик по пункту ниже центра выбирает ровно следующий', async ({ page }) => {
  const wheel = page.locator(WHEEL)
  await gotoTop(page, wheel) // Disadv.

  await clickOffset(page, wheel, +1)
  expect((await checkedLabel(wheel)).trim()).toBe('Normal')

  await clickOffset(page, wheel, +1)
  expect((await checkedLabel(wheel)).trim()).toBe('Adv.')

  await clickOffset(page, wheel, +1)
  expect((await checkedLabel(wheel)).trim()).toBe('Elven acc.')
})

test('клик по пункту выше центра выбирает ровно предыдущий', async ({ page }) => {
  const wheel = page.locator(WHEEL)
  await gotoTop(page, wheel)
  // спускаемся в самый низ, затем поднимаемся кликами вверх
  await clickOffset(page, wheel, +1)
  await clickOffset(page, wheel, +1)
  await clickOffset(page, wheel, +1)
  expect((await checkedLabel(wheel)).trim()).toBe('Elven acc.')

  await clickOffset(page, wheel, -1)
  expect((await checkedLabel(wheel)).trim()).toBe('Adv.')

  await clickOffset(page, wheel, -1)
  expect((await checkedLabel(wheel)).trim()).toBe('Normal')

  await clickOffset(page, wheel, -1)
  expect((await checkedLabel(wheel)).trim()).toBe('Disadv.')
})

test('клик не «прыгает» через пункт (регрессия бага прыжка)', async ({ page }) => {
  const wheel = page.locator(WHEEL)
  await gotoTop(page, wheel)
  await clickOffset(page, wheel, +1) // Disadv. → Normal

  // С «Normal» клик на один вниз обязан дать «Adv.», а не «Elven acc.».
  await clickOffset(page, wheel, +1)
  expect((await checkedLabel(wheel)).trim()).toBe('Adv.')
})

/**
 * Тач-сценарии. Эмулируем телефон (hasTouch/isMobile + узкий вьюпорт — там
 * WheelPicker и живёт) и шлём настоящие touch-события через CDP
 * (Input.dispatchTouchEvent): только так возникают pointer-события с
 * pointerType='touch' и нативный scroll-snap, на которые завязаны обе починки.
 */
test.describe('тач-жесты', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 780 } })

  /** Тап (без сдвига) в точке (x, y): touchStart → touchEnd. */
  async function tap(page: Page, x: number, y: number) {
    const session = await page.context().newCDPSession(page)
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await session.detach()
  }

  /** Вертикальный свайп пальцем от yFrom к yTo несколькими шагами (без инерции). */
  async function swipe(page: Page, x: number, yFrom: number, yTo: number, steps = 8) {
    const session = await page.context().newCDPSession(page)
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: yFrom }] })
    for (let i = 1; i <= steps; i++) {
      const y = yFrom + ((yTo - yFrom) * i) / steps
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] })
      await page.waitForTimeout(16)
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await session.detach()
  }

  test('первый тап раскрывает барабан', async ({ page }) => {
    const wheel = page.locator(WHEEL)
    await gotoTop(page, wheel) // приводим в свёрнутое состояние
    expect(await isOpen(wheel)).toBe(false)

    const c = await center(wheel)
    await tap(page, c.x, c.y)

    // Раньше pointerenter+pointerleave от касания открывали и тут же закрывали
    // барабан — первый тап «не срабатывал». Теперь первый тап раскрывает.
    await expect.poll(() => isOpen(wheel)).toBe(true)
  })

  test('свайп листает ровно на один пункт (не через два)', async ({ page }) => {
    const wheel = page.locator(WHEEL)
    await gotoTop(page, wheel) // Disadv. (верхний пункт)

    // Раскрываем тапом, ждём, пока окно развернётся.
    const c = await center(wheel)
    await tap(page, c.x, c.y)
    await expect.poll(() => isOpen(wheel)).toBe(true)
    await page.waitForTimeout(300)

    // Тянем палец вверх примерно на один пункт: контент уезжает вверх, в центр
    // приходит следующий пункт. Должны получить ровно Normal, а не Adv. (баг,
    // когда парный click после свайпа доводил выбор до пункта под пальцем).
    const c2 = await center(wheel)
    await swipe(page, c2.x, c2.y + ITEM_HEIGHT * 0.6, c2.y - ITEM_HEIGHT * 0.6)
    await page.waitForTimeout(400) // снап + дебаунс конца скролла

    await expect.poll(() => checkedLabel(wheel).then((s) => s.trim())).toBe('Normal')
  })

  test('тап по пункту ниже центра выбирает его (не «через один»)', async ({ page }) => {
    const wheel = page.locator(WHEEL)
    await gotoTop(page, wheel) // Disadv.

    // Раскрываем тапом.
    const c = await center(wheel)
    await tap(page, c.x, c.y)
    await expect.poll(() => isOpen(wheel)).toBe(true)
    await page.waitForTimeout(300)

    // Тап по пункту на один ниже центра → ровно следующий (Normal).
    const c2 = await center(wheel)
    await tap(page, c2.x, c2.y + ITEM_HEIGHT)
    await expect.poll(() => checkedLabel(wheel).then((s) => s.trim())).toBe('Normal')
  })
})
