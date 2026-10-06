import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'

test('zero, one and six photos prerender with deterministic HTML and functional links', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { default: Hero } = await server.ssrLoadModule('/src/components/Hero.jsx')
    const { heroImages } = await server.ssrLoadModule('/src/config/hero-images.js')
    assert.equal(heroImages.length, 6)
    for (const count of [0, 1, 6]) {
      const render = () => renderToString(createElement(Hero, { images: heroImages.slice(0, count) }))
      const html = render()
      assert.equal(html, render())
      assert.equal((html.match(/data-image-id=/g) || []).length, count ? 1 : 0)
      assert.ok(html.includes('https://secure.onreg.com/onreg2/front/step1.php?id=7837'))
      assert.ok(!html.includes('<button'))
      if (count) assert.ok(html.includes('data-image-id="open"'))
    }
  } finally { await server.close() }
})
