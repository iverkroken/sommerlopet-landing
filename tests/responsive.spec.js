import { test, expect } from '@playwright/test'
import { viewports } from './viewport-matrix.js'

import { layoutProblems } from './layout-check.js'

for (const [width, height] of viewports) {
  test(`composition ${width}x${height}, normal and 200% text`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width, height })
    await page.goto('/')
    expect(await layoutProblems(page)).toEqual([])
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    expect(await layoutProblems(page)).toEqual([])
  })
}

test('continuous resize in both directions and at content thresholds', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Full sweep in Chromium; fixed matrix covers all three engines.')
  test.setTimeout(120_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const height of [360, 900]) {
    for (const direction of [1, -1]) {
      for (let i = 0; i <= 1600; i += 4) {
        const width = direction === 1 ? 320 + i : 1920 - i
        await page.setViewportSize({ width, height })
        expect(await layoutProblems(page), `${width}x${height}`).toEqual([])
      }
    }
  }
  // Set the component width directly: actual query boundaries, not guessed devices.
  for (const threshold of [304, 576, 960]) for (const delta of [-1, 0, 1]) {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.locator('.distance-container').evaluate((element, width) => { element.style.width = `${width}px` }, threshold + delta)
    expect(await layoutProblems(page)).toEqual([])
  }
})

for (const deviceScaleFactor of [1, 2, 3]) {
  test(`DPR ${deviceScaleFactor} preserves composition`, async ({ browser }) => {
    const context = await browser.newContext({ deviceScaleFactor, viewport: { width: 393, height: 852 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')
    expect(await layoutProblems(page)).toEqual([])
    await expect(page.locator('.hero-image--current')).toBeVisible()
    await context.close()
  })
}
