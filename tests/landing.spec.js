import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const registration = 'https://secure.onreg.com/onreg2/front/step1.php?id=7837'
const activeImage = (page) => page.locator('.hero-image--current')

test('registration works from the server-rendered page without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sommerløpet 2027')
  await expect(page.getByText('5. juni 2027', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Meld deg på', exact: true })).toHaveCount(3)
  for (const link of await page.getByRole('link', { name: 'Meld deg på', exact: true }).all()) {
    await expect(link).toHaveAttribute('href', registration)
  }
  await expect(page.getByRole('button', { name: /bildebytte/ })).toHaveCount(0)
  await expect(activeImage(page)).toBeVisible()
  await page.route(registration, (route) => route.fulfill({ contentType: 'text/html', body: '<h1>OnReg test destination</h1>' }))
  await page.getByRole('link', { name: 'Meld deg på', exact: true }).first().click()
  await expect(page).toHaveURL(registration)
  await context.close()
})

test('hero rotates, pauses, and resumes without moving content', async ({ page }) => {
  await page.clock.install()
  await page.goto('/')
  const pause = page.getByRole('button', { name: 'Pause bildebytte' })
  await expect(pause).toBeVisible()
  const original = await activeImage(page).getAttribute('src')
  const documentBox = () => page.locator('h1').evaluate((heading) => {
    const box = heading.getBoundingClientRect()
    return { x: box.x + window.scrollX, y: box.y + window.scrollY, width: box.width, height: box.height }
  })
  const headingBox = await documentBox()
  await page.clock.runFor(7000)
  await expect(activeImage(page)).not.toHaveAttribute('src', original)
  await pause.click()
  const paused = await activeImage(page).getAttribute('src')
  await page.clock.runFor(14000)
  await expect(activeImage(page)).toHaveAttribute('src', paused)
  expect(await documentBox()).toEqual(headingBox)
  await page.getByRole('button', { name: 'Start bildebytte' }).click()
  await page.clock.runFor(7000)
  await expect(activeImage(page)).not.toHaveAttribute('src', paused)
})

test('reduced motion keeps a static hero, including a preference change', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.install()
  await page.goto('/')
  const original = await activeImage(page).getAttribute('src')
  await page.clock.runFor(14000)
  await expect(activeImage(page)).toHaveAttribute('src', original)
  await expect(page.getByRole('button', { name: /bildebytte/ })).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(page.getByRole('button', { name: 'Pause bildebytte' })).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.runFor(14000)
  await expect(activeImage(page)).toHaveAttribute('src', original)
})

test('failed next images keep the current image and registration usable', async ({ page }) => {
  await page.route('**/images/hero/*.webp', (route) => route.request().url().includes('/open-') ? route.continue() : route.abort())
  await page.clock.install()
  await page.goto('/')
  const original = await activeImage(page).getAttribute('src')
  await page.clock.runFor(21000)
  await expect(activeImage(page)).toHaveAttribute('src', original)
  await expect(page.getByRole('link', { name: 'Meld deg på', exact: true }).first()).toHaveAttribute('href', registration)
})

for (const width of [320, 390, 768, 1280, 1920]) {
  test(`layout reflows at ${width}px with enlarged and long text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
      document.querySelector('.hero-description').textContent += ' Ta med venner og familie til en sommerdag i Kristiansand, med plass til både små og store opplevelser.'
    })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const cta = page.getByRole('link', { name: 'Meld deg på', exact: true }).first()
    await cta.scrollIntoViewIfNeeded()
    await expect(cta).toBeInViewport()
  })
}

test('keyboard navigation and automated WCAG checks', async ({ page, browserName }) => {
  await page.goto('/')
  // Playwright's Windows WebKit port tabs only to form controls, unlike configured Safari.
  // Verify native link activation there; full Tab order is exercised in Chromium/Firefox.
  const windowsWebKit = browserName === 'webkit' && process.platform === 'win32'
  if (windowsWebKit) await page.getByRole('link', { name: 'Hopp til innhold' }).focus()
  else await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Hopp til innhold' })).toBeFocused()
  await page.keyboard.press('Enter')
  if (windowsWebKit) await page.locator('.hero .button').focus()
  else await page.keyboard.press('Tab')
  await expect(page.locator('.hero').getByRole('link', { name: 'Meld deg på', exact: true })).toBeFocused()
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(results.violations).toEqual([])
})

test('no page errors, tracking requests or cookies', async ({ page, context }) => {
  const errors = []
  const externalRequests = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173')) externalRequests.push(request.url())
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: /bildebytte/ })).toBeVisible()
  expect(errors).toEqual([])
  expect(externalRequests).toEqual([])
  expect(await context.cookies()).toEqual([])
})

test('blocked JavaScript still leaves a styled, actionable landing page', async ({ page }) => {
  await page.route('**/assets/*.js', (route) => route.abort())
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sommerløpet 2027')
  const cta = page.locator('.hero').getByRole('link', { name: 'Meld deg på', exact: true })
  await expect(cta).toHaveCSS('background-color', 'rgb(255, 98, 76)')
  await expect(cta).toHaveAttribute('href', registration)
  await expect(page.getByRole('button')).toHaveCount(0)
})

test('all hero images cycle and pause can be controlled with the keyboard', async ({ page }) => {
  await page.clock.install()
  await page.goto('/')
  await expect(page.getByRole('button')).toBeVisible()
  const sources = new Set([await activeImage(page).getAttribute('src')])
  for (let i = 0; i < 5; i++) {
    const previous = await activeImage(page).getAttribute('src')
    await page.clock.runFor(7000)
    await expect(activeImage(page)).not.toHaveAttribute('src', previous)
    sources.add(await activeImage(page).getAttribute('src'))
  }
  expect(sources.size).toBe(6)
  const button = page.getByRole('button')
  await button.focus()
  await page.keyboard.press('Space')
  await expect(button).toHaveAccessibleName('Start bildebytte')
  const paused = await activeImage(page).getAttribute('src')
  await page.clock.runFor(14000)
  await expect(activeImage(page)).toHaveAttribute('src', paused)
  await page.keyboard.press('Enter')
  await expect(button).toHaveAccessibleName('Pause bildebytte')
  await page.clock.runFor(7000)
  await expect(activeImage(page)).not.toHaveAttribute('src', paused)
})

test('mobile WCAG checks include paused controls and an entirely white hero image', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/images/hero/*.webp', (route) => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><path fill="white" d="M0 0h1920v1080H0z"/></svg>',
  }))
  await page.goto('/')
  await page.getByRole('button').click()
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(result.violations).toEqual([])
})
