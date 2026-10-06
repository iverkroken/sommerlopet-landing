import { test, expect } from '@playwright/test'

test('only the first and next photo download, pause starts no further loads', async ({ page }) => {
  const photos = new Set()
  page.on('request', (request) => {
    const match = request.url().match(/\/hero\/(.+)-\d+\.webp/)
    if (match) photos.add(match[1])
  })
  await page.goto('/')
  await expect.poll(() => photos.size).toBe(2)
  await page.getByRole('button', { name: 'Pause bildebytte' }).click()
  await page.clock.install()
  await page.clock.runFor(14000)
  expect(photos.size).toBe(2)
})

test('reduced motion requests one photo and leaves every reveal visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const photos = new Set()
  page.on('request', (request) => { if (/\/hero\/.+\.webp/.test(request.url())) photos.add(request.url()) })
  await page.goto('/')
  await page.locator('.closing').scrollIntoViewIfNeeded()
  await expect(page.locator('.is-revealing')).toHaveCount(0)
  expect(photos.size).toBe(1)
  for (const item of await page.locator('[data-reveal]').all()) {
    await expect(item).toHaveCSS('opacity', '1')
    await expect(item).toHaveCSS('transform', 'none')
  }
})

test('reveal animates once, uses stagger and stops when reduced motion is enabled', async ({ page }) => {
  await page.goto('/')
  // The static page may load before React has attached the observer.
  await expect(page.getByRole('button', { name: 'Pause bildebytte' })).toBeVisible()
  await page.evaluate(() => {
    window.revealStarts = []
    document.addEventListener('animationstart', (event) => {
      if (event.animationName === 'reveal') window.revealStarts.push({ type: event.target.dataset.reveal,
        delay: Math.round(parseFloat(getComputedStyle(event.target).animationDelay) * 1000) })
    })
    document.querySelector('.distance-list').scrollIntoView({ behavior: 'instant', block: 'center' })
  })
  await expect.poll(() => page.evaluate(() => window.revealStarts.filter((event) => event.type === 'distance').length)).toBe(5)
  const delays = await page.evaluate(() => window.revealStarts.filter((event) => event.type === 'distance').map((event) => event.delay).sort((a, b) => a - b))
  expect(delays).toEqual([0, 100, 200, 300, 400])
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.is-revealing')).toHaveCount(0)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.locator('.distance-list').scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => window.revealStarts.filter((event) => event.type === 'distance').length)).toBe(5)
})

test('without IntersectionObserver, content stays visible', async ({ page }) => {
  await page.addInitScript(() => { delete window.IntersectionObserver })
  await page.goto('/')
  await page.locator('.closing').scrollIntoViewIfNeeded()
  for (const item of await page.locator('[data-reveal]').all()) await expect(item).toHaveCSS('opacity', '1')
})

test('keyboard focus cancels a CTA reveal immediately', async ({ page }) => {
  await page.goto('/')
  const cta = page.locator('.closing .button')
  await cta.focus()
  await expect(cta).toBeFocused()
  await expect(page.locator('[data-reveal="cta"]')).toHaveCSS('opacity', '1')
  await expect(page.locator('[data-reveal="cta"]')).toHaveCSS('transform', 'none')
})
