import { readdirSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const srcDir = path.resolve(__dirname, 'src')
const rootIndexHtml = path.join(srcDir, 'index.html')

function getSrcFolders(): string[] {
  return readdirSync(srcDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort()
}

function buildIndexHtml(folders: string[]): string {
  const links = folders
    .map((name) => `    <li><a href="/${name}/">${name}</a></li>`)
    .join('\n')

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Playground</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        max-width: 40rem;
        margin: 2rem auto;
        padding: 0 1rem;
      }
      h1 {
        font-size: 1.5rem;
      }
      ul {
        line-height: 1.8;
      }
      a {
        color: #0969da;
      }
    </style>
  </head>
  <body>
    <h1>Playground</h1>
    <ul>
${links || '    <li>暂无 demo</li>'}
    </ul>
  </body>
</html>
`
}

function indexDirectoryPlugin(): Plugin {
  return {
    name: 'index-directory',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (path.normalize(ctx.filename) !== path.normalize(rootIndexHtml)) {
          return html
        }
        return buildIndexHtml(getSrcFolders())
      },
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split('?')[0] ?? ''
        if (pathname !== '/' && pathname !== '/index.html') {
          return next()
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(buildIndexHtml(getSrcFolders()))
      })
    },
  }
}

export default defineConfig({
  plugins: [indexDirectoryPlugin(), react()],
  root: srcDir,
  server: {
    port: 5913,
  },
})
