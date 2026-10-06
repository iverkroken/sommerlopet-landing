import { test, expect } from '@playwright/test'

test('resizing after a preload revalidates the responsive source before replacing the photo', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.addInitScript(() => {
    Math.random = () => 0
    window.decodedPhotos = []
    const decode = HTMLImageElement.prototype.decode
    HTMLImageElement.prototype.decode = async function () {
      await decode.call(this)
      window.decodedPhotos.push(this.currentSrc)
    }
  })
  await page.route('**/older-1920.webp', (route) => route.abort())
  await page.clock.install()
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Pause bildebytte' })).toBeVisible()
  await page.clock.runFor(1000)
  await expect.poll(() => page.evaluate(() => window.decodedPhotos.some((src) => src.endsWith('/older-320.webp')))).toBe(true)
  await page.setViewportSize({ width: 1440, height: 900 })
  const photo = page.locator('.hero-image--current')
  await page.clock.runFor(8000)
  await expect(photo).not.toHaveAttribute('data-image-id', 'open')
  await page.clock.runFor(1000)
  await expect(photo).not.toHaveAttribute('data-image-id', 'older')
  await expect(photo).toBeVisible()
  expect(await photo.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true)
})
