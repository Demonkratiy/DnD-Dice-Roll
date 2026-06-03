import { test, expect, type Page, type Locator } from '@playwright/test'

/**
 * E2E на WheelPicker — именно тот класс багов, который НЕ ловится в jsdom:
 * выбор пункта кликом считается геометрически (смещение курсора от центра /
 * ITEM_HEIGHT), а на это влияют реальный layout, scroll-snap и CSS-переходы.
 *
 * Ранее тут был баг «прыжка»: клик по соседнему пункту выбирал пункт через
 * один, а верхний не выбирался вовсе. Эти тесты фиксируют, что выбор кликом
 * вверх/вниз стабилен и шагает ровно на один пункт.
 */

const WHEEL = '[role="radiogroup"][aria-label="Режим броска"]'
const ITEM_HEIGHT = 40

// Порядок пунктов барабана режима d20 (сверху вниз).
const MODES = ['Помеха', 'Обычный', 'Преим.', 'Эльф. меткость']

function checkedLabel(wheel: Locator) {
  return wheel.locator('[role="radio"][aria-checked="true"]').innerText()
}

/** Центр корня барабана (его высота постоянна — barrel раскрывается абсолютно). */
async function center(wheel: Locator) {
  const box = await wheel.boundingBox()
  if (!box) throw new Error('WheelPicker не виден')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

/** Раскрывает барабан наведением и кликает по пункту со смещением offset от центра. */
async function clickOffset(page: Page, wheel: Locator, offsetItems: number) {
  await wheel.hover()
  await page.waitForTimeout(300) // дождаться раскрытия (CSS-переход высоты barrel)
  const c = await center(wheel)
  await page.mouse.move(c.x, c.y + offsetItems * ITEM_HEIGHT)
  await page.mouse.down()
  await page.mouse.up()
  await page.waitForTimeout(250)
}

/** Приводит барабан в детерминированное состояние — верхний пункт (Помеха). */
async function gotoTop(page: Page, wheel: Locator) {
  await wheel.focus()
  for (let i = 0; i < MODES.length; i++) {
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(60)
  }
  await page.mouse.click(5, 5) // увести фокус → барабан схлопывается
  await page.waitForTimeout(200)
  await expect.poll(() => checkedLabel(wheel)).toBe('Помеха')
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.getByRole('radio', { name: 'd20' }).click()
  await expect(page.locator(WHEEL)).toBeVisible()
})

test('клик по пункту ниже центра выбирает ровно следующий', async ({ page }) => {
  const wheel = page.locator(WHEEL)
  await gotoTop(page, wheel) // Помеха

  await clickOffset(page, wheel, +1)
  expect((await checkedLabel(wheel)).trim()).toBe('Обычный')

  await clickOffset(page, wheel, +1)
  expect((await checkedLabel(wheel)).trim()).toBe('Преим.')

  await clickOffset(page, wheel, +1)
  expect((await checkedLabel(wheel)).trim()).toBe('Эльф. меткость')
})

test('клик по пункту выше центра выбирает ровно предыдущий', async ({ page }) => {
  const wheel = page.locator(WHEEL)
  await gotoTop(page, wheel)
  // спускаемся в самый низ, затем поднимаемся кликами вверх
  await clickOffset(page, wheel, +1)
  await clickOffset(page, wheel, +1)
  await clickOffset(page, wheel, +1)
  expect((await checkedLabel(wheel)).trim()).toBe('Эльф. меткость')

  await clickOffset(page, wheel, -1)
  expect((await checkedLabel(wheel)).trim()).toBe('Преим.')

  await clickOffset(page, wheel, -1)
  expect((await checkedLabel(wheel)).trim()).toBe('Обычный')

  await clickOffset(page, wheel, -1)
  expect((await checkedLabel(wheel)).trim()).toBe('Помеха')
})

test('клик не «прыгает» через пункт (регрессия бага прыжка)', async ({ page }) => {
  const wheel = page.locator(WHEEL)
  await gotoTop(page, wheel)
  await clickOffset(page, wheel, +1) // Помеха → Обычный

  // С «Обычный» клик на один вниз обязан дать «Преим.», а не «Эльф. меткость».
  await clickOffset(page, wheel, +1)
  expect((await checkedLabel(wheel)).trim()).toBe('Преим.')
})
