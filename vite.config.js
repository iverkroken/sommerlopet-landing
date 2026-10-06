import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The development page uses exactly the same server markup as the static build.
function prerenderDevelopment() {
  let server
  return {
    name: 'sommerlopet-prerender-dev',
    apply: 'serve',
    configureServer(viteServer) { server = viteServer },
    async transformIndexHtml(html) {
      if (!server) return html
      const { render } = await server.ssrLoadModule('/src/entry-server.jsx')
      return html.replace('<!--app-html-->', render())
    },
  }
}

export default defineConfig({
  plugins: [react(), prerenderDevelopment()],
})
