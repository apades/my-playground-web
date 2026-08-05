import { readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const TARGET_FILES = ['App.tsx', 'index.html', 'index.tsx'] as const

function toPascalCase(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function assertEmptyDir(dir: string): void {
  const entries = readdirSync(dir, { withFileTypes: true }).filter(
    (entry) => entry.name !== 'node_modules',
  )

  if (entries.length > 0) {
    const names = entries.map((e) => e.name).join(', ')
    console.error(`目录必须为空才能初始化，当前包含: ${names}`)
    process.exit(1)
  }
}

function buildAppTsx(folderName: string, componentName: string): string {
  return `import '@style/index'

export function ${componentName}() {
  return (
    <main className="f-center min-h-screen">
      <h1>${folderName}</h1>
    </main>
  )
}
`
}

function buildIndexHtml(folderName: string): string {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${folderName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./index.tsx"></script>
  </body>
</html>
`
}

function buildIndexTs(folderName: string, componentName: string): string {
  return `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ${componentName} } from './App'

const root = document.getElementById('root')
if (!root) {
  throw new Error('${folderName}: #root not found')
}

createRoot(root).render(
  <StrictMode>
    <${componentName} />
  </StrictMode>,
)
`
}

function main(): void {
  // pnpm/npm 在 package 根目录执行脚本，INIT_CWD 为用户执行命令时所在目录
  const targetDir = process.env.INIT_CWD ?? process.cwd()
  const folderName = path.basename(targetDir)

  if (!folderName || folderName === '.' || folderName === '..') {
    console.error(
      '无法解析文件夹名称，请先 cd 到目标空文件夹再执行 pnpm run init',
    )
    process.exit(1)
  }

  const componentName = toPascalCase(folderName)
  if (!componentName || !/^[A-Z]/.test(componentName)) {
    console.error(
      `文件夹名 "${folderName}" 无法生成合法的 React 组件名，请使用字母、数字、- 或 _`,
    )
    process.exit(1)
  }

  assertEmptyDir(targetDir)

  const files: Record<(typeof TARGET_FILES)[number], string> = {
    'App.tsx': buildAppTsx(folderName, componentName),
    'index.html': buildIndexHtml(folderName),
    'index.tsx': buildIndexTs(folderName, componentName),
  }

  for (const name of TARGET_FILES) {
    writeFileSync(path.join(targetDir, name), files[name], 'utf8')
  }

  console.log(`已创建 Vite demo（${folderName}）:`)
  for (const name of TARGET_FILES) {
    console.log(`  - ${path.join(targetDir, name)}`)
  }
}

main()
