import { chromium, test, expect } from '@playwright/test'
import { layoutProblems } from './layout-check.js'

test('native browser zoom at 200% and 400% reflows and preserves every CTA', async ({ browserName, baseURL }, testInfo) => {
  test.skip(browserName !== 'chromium', 'Uses Chromium browser settings, not CSS zoom or pinch emulation.')
  // An ephemeral persistent profile permits chrome://settings. It never uses a personal profile.
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium', viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce',
  })
  try {
    const page = await context.newPage()
    for (const zoom of [2, 4]) {
      await page.goto('chrome://settings/appearance')
      await page.evaluate((factor) => new Promise((resolve) => {
        window.chrome.settingsPrivate.setDefaultZoom(factor, resolve)
      }), zoom)
      await page.goto(baseURL)
      expect(await page.evaluate(() => innerWidth)).toBe(1280 / zoom)
      expect(await page.evaluate(() => devicePixelRatio)).toBe(zoom)
      expect(await page.evaluate(() => visualViewport.scale)).toBe(1)
      expect(await layoutProblems(page)).toEqual([])
      for (const cta of await page.locator('.button--primary').all()) {
        await cta.scrollIntoViewIfNeeded()
        await expect(cta).toBeInViewport()
        await expect(cta).toHaveAttribute('href', 'https://secure.onreg.com/onreg2/front/step1.php?id=7837')
      }
      await page.locator('.hero-image--current').evaluate((image) => image.decode())
      // Full-page screenshot stitching miscalculates native zoom in Playwright.
      // Capture actual viewports, preserving the browser's real zoom and layout.
      for (const section of ['.site-header', '.hero-media', '.distance-list', '.campaign-footer']) {
        await page.locator(section).scrollIntoViewIfNeeded()
        await page.screenshot({ path: testInfo.outputPath(`browser-zoom-${zoom * 100}-${section.slice(1)}.png`) })
      }
    }
  } finally { await context.close() }
})
