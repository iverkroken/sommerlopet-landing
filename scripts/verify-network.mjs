import { chromium, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const browser = await chromium.launch()
const scenarios = []
try {
  for (const [width, height, deviceScaleFactor] of [[390, 844, 2], [1440, 900, 1]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor })
    const page = await context.newPage()
    const photos = new Set()
    page.on('request', (request) => { if (/\/hero\/.+\.webp/.test(request.url())) photos.add(request.url()) })
    await page.goto(process.env.QA_URL || 'http://127.0.0.1:4174')
    await expect(page.getByRole('button', { name: 'Pause bildebytte' })).toBeVisible()
    await expect.poll(() => photos.size).toBe(2)
    await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource').filter((entry) => entry.name.includes('/images/hero/')).length)).toBe(2)
    await page.getByRole('button', { name: 'Pause bildebytte' }).click()
    scenarios.push({ width, height, dpr: deviceScaleFactor, ...await page.evaluate(() => ({
      firstPhoto: new URL(document.querySelector('.hero-image--current').currentSrc).pathname,
      resources: [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')].map((entry) => ({
        path: new URL(entry.name).pathname, encodedBodyBytes: entry.encodedBodySize, transferBytes: entry.transferSize,
      })),
    })) })
    await page.clock.install()
    await page.clock.runFor(14000)
    expect(photos.size).toBe(2)
    await context.close()
  }
} finally { await browser.close() }
await mkdir('reports', { recursive: true })
await writeFile('reports/network.json', JSON.stringify({
  note: 'Cold browser contexts against local Vite preview. encodedBodyBytes reflects negotiated compression; transferBytes also includes estimated response overhead. Two photos total: visible deterministic first and one queued next. Pausing and advancing 14 seconds requested no others. Next photo varies by shuffle.',
  scenarios,
}, null, 2) + '\n')
console.log('Verified cold-cache image requests; reports/network.json')
