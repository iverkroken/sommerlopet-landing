import { build } from 'vite'
import { readFile, writeFile, rm } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

await build()
await build({
  build: {
    ssr: 'src/entry-server.jsx',
    outDir: '.prerender',
    copyPublicDir: false,
  },
})
const { render } = await import(pathToFileURL(resolve('.prerender/entry-server.js')).href)
const template = await readFile('dist/index.html', 'utf8')
if (!template.includes('<!--app-html-->')) throw new Error('Missing prerender placeholder')
await writeFile('dist/index.html', template.replace('<!--app-html-->', render()))
await rm(resolve('.prerender'), { recursive: true, force: true })
console.log('Prerendered landing page: dist/index.html')
