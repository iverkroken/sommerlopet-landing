import { test, expect } from '@playwright/test'

async function waitForDecoded(page, filename) {
  await expect.poll(() => page.evaluate(
    (name) => window.decodedPhotos.some((src) => src.endsWith(`/${name}`)), filename,
  )).toBe(true)
}

for (const delayDecode of [false, true]) {
  test(delayDecode
    ? 'resizing keeps the current photo until the responsive fallback finishes decoding'
    : 'resizing after a preload revalidates the responsive source before replacing the photo', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.addInitScript((delay) => {
      Math.random = () => 0
      window.decodedPhotos = []
      window.shownPhotos = []
      window.fallbackDecodeHeld = false
      const gate = new Promise((resolve) => { window.releaseFallbackDecode = resolve })
      const decode = HTMLImageElement.prototype.decode
      HTMLImageElement.prototype.decode = async function () {
        await decode.call(this)
        if (delay && !this.isConnected && this.currentSrc.endsWith('/finish-1-600.webp')) {
          window.fallbackDecodeHeld = true
          await gate
        }
        window.decodedPhotos.push(this.currentSrc)
      }
      document.addEventListener('DOMContentLoaded', () => {
        const recordPhoto = () => {
          const id = document.querySelector('.hero-image--current')?.dataset.imageId
          if (id && window.shownPhotos.at(-1) !== id) window.shownPhotos.push(id)
        }
        recordPhoto()
        new MutationObserver(recordPhoto).observe(document.querySelector('.hero-visual'), {
          childList: true, subtree: true, attributes: true,
        })
      })
    }, delayDecode)
    let rejectedDesktopRequests = 0
    await page.route('**/older-1920.webp', async (route) => {
      await route.abort()
      rejectedDesktopRequests += 1
    })
    await page.clock.install()
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Pause bildebytte' })).toBeVisible()
    await page.clock.runFor(1000)
    await waitForDecoded(page, 'older-320.webp')
    await page.setViewportSize({ width: 1440, height: 900 })
    const photo = page.locator('.hero-image--current')

    if (delayDecode) {
      await expect.poll(() => page.evaluate(() => window.fallbackDecodeHeld)).toBe(true)
      await page.clock.runFor(6000)
      await expect(photo).toHaveAttribute('data-image-id', 'open')
      await expect(photo).toBeVisible()
      expect(await photo.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true)
      expect(await page.evaluate(() => window.shownPhotos)).toEqual(['open'])
      await page.evaluate(() => window.releaseFallbackDecode())
    }

    // Virtual time does not await native resize events or image decoding. This
    // barrier proves responsive revalidation completed before advancing timers.
    await waitForDecoded(page, 'finish-1-600.webp')
    expect(rejectedDesktopRequests).toBeGreaterThan(0)
    if (!delayDecode) await page.clock.runFor(6000)
    await expect(photo).toHaveAttribute('data-image-id', 'finish-1')
    await expect(photo).not.toHaveAttribute('data-image-id', 'older')
    await expect(photo).toBeVisible()
    expect(await photo.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true)
    expect(await page.evaluate(() => window.shownPhotos)).toEqual(['open', 'finish-1'])

    // The failed desktop candidate must be excluded without rebuilding or
    // prematurely consuming the deterministic shuffle queue.
    await waitForDecoded(page, 'finish-2-600.webp')
    await page.clock.runFor(6000)
    await expect(photo).toHaveAttribute('data-image-id', 'finish-2')
    expect(await page.evaluate(() => window.shownPhotos)).toEqual(['open', 'finish-1', 'finish-2'])
  })
}
