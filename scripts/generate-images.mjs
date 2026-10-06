import sharp from 'sharp'
import { mkdir, writeFile, stat } from 'node:fs/promises'
import { sources } from './hero-sources.mjs'

await mkdir('public/images/hero', { recursive: true })
await mkdir('src/generated', { recursive: true })
const manifest = []
for (const { id, file } of sources) {
  const original = `src/images/${file}`
  const { width, height } = await sharp(original).metadata()
  const widths = [...new Set([320, 480, 640, 960, 1280, 1920, Math.min(width, 1920)])].filter((size) => size <= width).sort((a, b) => a - b)
  const variants = []
  for (const size of widths) {
    const path = `/images/hero/${id}-${size}.webp`
    const output = await sharp(original).rotate().resize({ width: size, withoutEnlargement: true }).webp({ quality: 80, effort: 5 }).toFile(`public${path}`)
    variants.push({ src: path, width: output.width, height: output.height, bytes: output.size })
  }
  const fallback = variants.find((image) => image.width >= 960) ?? variants.at(-1)
  manifest.push({ id, original: file, originalBytes: (await stat(original)).size, width, height, src: fallback.src,
    srcSet: variants.map((image) => `${image.src} ${image.width}w`).join(', '), variants })
}
await writeFile('src/generated/hero-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Generated ${manifest.reduce((count, item) => count + item.variants.length, 0)} WebP variants from ${manifest.length} originals (no upscaling).`)
