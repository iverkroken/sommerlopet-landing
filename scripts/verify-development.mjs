import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { chromium, expect } from '@playwright/test'

// The development build replays effects in React StrictMode; production does not.
const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, cacheDir: '.superpowers/vite-qa-cache' })
const browser = await chromium.launch()
try {
  await server.listen()
  const url = server.resolvedUrls.local[0]
  const html = await (await fetch(url)).text()
  assert.ok(html.includes('data-image-id="open"'))
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.clock.install()
  await page.goto(url)
  await expect(page.getByRole('button', { name: 'Pause bildebytte' })).toBeVisible()
  const photo = page.locator('.hero-image--current')
  await expect(photo).toHaveAttribute('data-image-id', 'open')
  const ids = new Set(['open'])
  for (let i = 0; i < 5; i++) {
    const previous = await photo.getAttribute('data-image-id')
    await page.clock.runFor(7000)
    await expect(photo).not.toHaveAttribute('data-image-id', previous)
    ids.add(await photo.getAttribute('data-image-id'))
  }
  assert.equal(ids.size, 6)
  assert.deepEqual(errors, [])
  console.log('Development StrictMode: deterministic hydration, six distinct slides, no console or page errors.')
} finally { await browser.close(); await server.close() }
