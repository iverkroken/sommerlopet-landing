import { chromium, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { viewports } from '../tests/viewport-matrix.js'

// Run against a production preview: QA_URL=http://127.0.0.1:4174 npm run qa:capture.
const baseURL = process.env.QA_URL || 'http://127.0.0.1:4174'
const directory = 'artifacts/qa'
await mkdir(directory, { recursive: true })
const browser = await chromium.launch()
const captures = []
try {
  for (const [width, height] of viewports) {
    const page = await browser.newPage({ viewport: { width, height } })
    await page.clock.install()
    await page.goto(baseURL)
    const current = page.locator('.hero-image--current')
    await expect(page.getByRole('button', { name: 'Pause bildebytte' })).toBeVisible()
    const thumbnails = []
    for (let i = 0; i < 6; i++) {
      await current.evaluate((image) => image.decode())
      await page.getByRole('button', { name: 'Pause bildebytte' }).click()
      const id = await current.getAttribute('data-image-id')
      const file = `${directory}/${width}x${height}-${id}.png`
      await page.locator('.hero').screenshot({ path: file, animations: 'disabled' })
      thumbnails.push(await sharp(file).resize({ width: 360 }).png().toBuffer())
      if (i === 0) {
        await page.screenshot({ path: `${directory}/${width}x${height}-page.png`, fullPage: true, animations: 'disabled' })
      }
      captures.push({ width, height, id, file })
      if (i < 5) {
        await page.getByRole('button', { name: 'Start bildebytte' }).click()
        await page.clock.runFor(7000)
        await expect(current).not.toHaveAttribute('data-image-id', id)
        // Pause removes the entering animation, so crops show the fully opaque image.
      }
    }
    const sizes = await Promise.all(thumbnails.map((buffer) => sharp(buffer).metadata()))
    const cellHeight = Math.max(...sizes.map((size) => size.height)) + 24
    await sharp({ create: { width: 1080, height: cellHeight * 2, channels: 3, background: '#fff4f0' } })
      .composite(thumbnails.map((input, i) => ({ input, left: (i % 3) * 360, top: Math.floor(i / 3) * cellHeight })))
      .png().toFile(`${directory}/${width}x${height}-heroes.png`)
    await page.close()
    console.log(`Captured all six heroes and full page: ${width}x${height}`)
  }
  await writeFile(`${directory}/manifest.json`, JSON.stringify(captures, null, 2) + '\n')
} finally { await browser.close() }
